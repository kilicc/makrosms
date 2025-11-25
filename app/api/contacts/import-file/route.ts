import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { formatPhoneNumber } from '@/lib/utils/cepSMSProvider';

// POST /api/contacts/import-file - CSV/Excel dosyasından rehber import et
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string | null;
    const nameColumn = formData.get('nameColumn') as string | null;
    const phoneColumn = formData.get('phoneColumn') as string | null;

    console.log('[Import] Received params:', { groupId, nameColumn, phoneColumn });

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Dosya yüklenmedi' },
        { status: 400 }
      );
    }

    if (!phoneColumn) {
      return NextResponse.json(
        { success: false, message: 'Telefon numarası sütunu seçilmedi' },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isCSV = fileExtension === 'csv';
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { success: false, message: 'Sadece CSV veya Excel dosyaları destekleniyor' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer);

    let contacts: any[] = [];
    let detectedColumns: string[] = [];

    if (isCSV) {
      // CSV parse
      const Papa = require('papaparse');
      const csvText = fileContent.toString('utf-8');
      
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        encoding: 'utf-8',
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        console.error('CSV parse errors:', parseResult.errors);
      }

      contacts = parseResult.data || [];
      detectedColumns = contacts.length > 0 ? Object.keys(contacts[0]) : [];
    } else if (isExcel) {
      // Excel parse - EXACTLY same logic as preview endpoint
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileContent, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Excel dosyasında sayfa bulunamadı' },
          { status: 400 }
        );
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet || !worksheet['!ref']) {
        return NextResponse.json(
          { success: false, message: 'Excel sayfası boş veya geçersiz' },
          { status: 400 }
        );
      }
      
      // Önce header ile dene (normal durum) - SAME AS PREVIEW
      let contactsWithHeader = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
      });
      
      // Eğer header yoksa veya ilk satır boşsa, header olmadan dene
      if (contactsWithHeader.length === 0 || !Object.keys(contactsWithHeader[0] || {}).length) {
        // Header olmadan oku - ilk satırı da veri olarak al
        contacts = XLSX.utils.sheet_to_json(worksheet, {
          header: ['numara'],
          raw: false,
          defval: '',
        });
        console.log('[Import] Excel parsed without header, contacts count:', contacts.length);
        
        // Eğer hala boşsa, tüm sütunları sayısal key olarak oku
        if (contacts.length === 0) {
          const allData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Array of arrays
            raw: false,
            defval: '',
          });
          
          if (allData.length > 0) {
            // İlk satırı header olarak kullan, gerisini veri - SAME AS PREVIEW
            const firstRow = allData[0] as any[];
            const headerRow = firstRow.map((val, idx) => String(val || '').trim() || `Sütun ${idx + 1}`);
            detectedColumns = headerRow;
            
            // Kalan satırları veri olarak işle
            contacts = allData.slice(1).map((row: any[]) => {
              const obj: any = {};
              headerRow.forEach((header, idx) => {
                obj[header] = String(row[idx] || '').trim();
              });
              return obj;
            });
          }
        } else {
          // Numeric key'leri düzelt - SAME AS PREVIEW
          if (contacts.length > 0 && Object.keys(contacts[0] || {}).some(key => /^\d+$/.test(key))) {
            const keys = Object.keys(contacts[0]);
            detectedColumns = keys.map((_, idx) => `Sütun ${idx + 1}`);
            contacts = contacts.map((row: any) => {
              const newRow: any = {};
              keys.forEach((key, idx) => {
                newRow[detectedColumns[idx]] = String(row[key] || '').trim();
              });
              return newRow;
            });
          } else {
            detectedColumns = contacts.length > 0 ? Object.keys(contacts[0]) : [];
          }
        }
      } else {
        // Header ile başarılı okuma - SAME AS PREVIEW
        contacts = contactsWithHeader;
        detectedColumns = contacts.length > 0 ? Object.keys(contacts[0]) : [];
        console.log('[Import] Excel parsed with header, contacts count:', contacts.length);
      }
      
      console.log('[Import] Detected columns:', detectedColumns);
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dosyada kişi bulunamadı' },
        { status: 400 }
      );
    }

    // Get existing contacts for this user
    const { data: existingContacts } = await supabaseServer
      .from('contacts')
      .select('phone')
      .eq('user_id', auth.user.userId);

    const existingPhones = new Set((existingContacts || []).map((c: any) => c.phone));

    const contactsToInsert: any[] = [];
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < contacts.length; i++) {
      const contactData = contacts[i];
      let phoneValue = 'Unknown';
      
      try {
        const availableKeys = Object.keys(contactData);
        
        // Log first row for debugging
        if (i === 0) {
          console.log('[Import] Row 0 - Available columns:', availableKeys);
          console.log('[Import] Row 0 - User selected nameColumn:', nameColumn);
          console.log('[Import] Row 0 - User selected phoneColumn:', phoneColumn);
          console.log('[Import] Row 0 - Sample data:', contactData);
        }
        
        // Use user-selected columns - exact match or case-insensitive
        let nameField: string | null = null;
        let phoneField: string | null = null;
        
        // Find phone column - try multiple matching strategies
        if (phoneColumn) {
          // 1. Exact match
          if (availableKeys.includes(phoneColumn)) {
            phoneField = phoneColumn;
          } else {
            // 2. Case-insensitive match
            phoneField = availableKeys.find(
              key => key.toLowerCase().trim() === phoneColumn.toLowerCase().trim()
            ) || null;
            
            // 3. Normalized match (remove special chars, spaces)
            if (!phoneField) {
              const normalizedPhone = phoneColumn.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
              phoneField = availableKeys.find(
                key => key.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === normalizedPhone
              ) || null;
            }
          }
        }
        
        // Find name column - try exact match first, then case-insensitive
        if (nameColumn) {
          if (availableKeys.includes(nameColumn)) {
            nameField = nameColumn;
          } else {
            nameField = availableKeys.find(
              key => key.toLowerCase().trim() === nameColumn.toLowerCase().trim()
            ) || null;
          }
        }
        
        // Log first row field matching
        if (i === 0) {
          console.log('[Import] Row 0 - Found nameField:', nameField);
          console.log('[Import] Row 0 - Found phoneField:', phoneField);
        }
        
        // Get values from matched fields
        const name = nameField ? String(contactData[nameField] || '').trim() : '';
        let phoneRaw = phoneField ? String(contactData[phoneField] || '').trim() : '';
        
        // Handle empty values
        if (phoneRaw === '') {
          phoneRaw = '';
        }
        
        // Check if phone column was selected but value is empty
        if (!phoneRaw && phoneColumn) {
          results.failed++;
          results.errors.push(`Satır ${i + 1}: Seçilen telefon sütunu (${phoneColumn}) boş veya bulunamadı`);
          continue;
        }
        
        phoneValue = phoneRaw || 'Unknown';
        
        // Generate default name if needed
        let finalName = name;
        if (!finalName && phoneRaw) {
          const cleanedPhone = phoneRaw.replace(/\D/g, '');
          const last4Digits = cleanedPhone.length >= 4 
            ? cleanedPhone.substring(cleanedPhone.length - 4) 
            : cleanedPhone;
          finalName = `Kişi ${last4Digits}`;
        } else if (!finalName) {
          finalName = `Kişi ${i + 1}`;
        }
        
        // Format phone number
        let phone: string;
        try {
          phone = formatPhoneNumber(phoneRaw);
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Satır ${i + 1}: ${phoneValue} - ${error.message || 'Geçersiz telefon formatı'}`);
          continue;
        }
        
        // Check if phone already exists
        if (existingPhones.has(phone)) {
          results.failed++;
          results.errors.push(`Satır ${i + 1}: ${phoneValue} (${phone}) - Zaten kayıtlı`);
          continue;
        }
        
        // Use selected groupId (handle empty string)
        const finalGroupId = (groupId && groupId.trim() !== "") ? groupId : null;
        
        contactsToInsert.push({
          user_id: auth.user.userId,
          name: finalName,
          phone,
          email: null,
          notes: null,
          group_id: finalGroupId,
        });
        
        existingPhones.add(phone);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Satır ${i + 1}: ${phoneValue} - ${error.message || 'Bilinmeyen hata'}`);
      }
    }

    // Bulk insert contacts
    if (contactsToInsert.length > 0) {
      console.log('[Import] Inserting', contactsToInsert.length, 'contacts');
      console.log('[Import] First contact sample:', contactsToInsert[0]);
      
      const { error: insertError } = await supabaseServer
        .from('contacts')
        .insert(contactsToInsert);

      if (insertError) {
        console.error('[Import] Insert error:', insertError);
        return NextResponse.json(
          { success: false, message: insertError.message || 'Kişiler import edilemedi' },
          { status: 500 }
        );
      }
      
      // Update group contact count if groupId exists
      if (groupId && results.success > 0) {
        console.log('[Import] Updating group count for groupId:', groupId);
        const { data: groupData } = await supabaseServer
          .from('contact_groups')
          .select('contact_count')
          .eq('id', groupId)
          .single();

        if (groupData) {
          await supabaseServer
            .from('contact_groups')
            .update({ contact_count: (groupData.contact_count || 0) + results.success })
            .eq('id', groupId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import tamamlandı: ${results.success} başarılı, ${results.failed} başarısız`,
      data: results,
    });
  } catch (error: any) {
    console.error('[Import] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Import hatası' },
      { status: 500 }
    );
  }
}
