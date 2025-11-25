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
      // Excel parse - same logic as preview endpoint
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
      
      // Try with header first (normal case)
      let contactsWithHeader = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
      });
      
      // If no header or first row doesn't look like headers, try without header
      if (contactsWithHeader.length === 0 || !Object.keys(contactsWithHeader[0] || {}).length) {
        // Try without header
        contacts = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Array of arrays
          raw: false,
          defval: '',
        });
        
        if (contacts.length > 0) {
          // First row as header
          const firstRow = contacts[0] as any[];
          detectedColumns = firstRow.map((val, idx) => String(val || '').trim() || `Sütun ${idx + 1}`);
          
          // Remaining rows as data
          contacts = contacts.slice(1).map((row: any[]) => {
            const obj: any = {};
            detectedColumns.forEach((header, idx) => {
              obj[header] = String(row[idx] || '').trim();
            });
            return obj;
          });
        } else {
          // Last resort: numeric keys
          contacts = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: '',
          });
          
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
        console.log('[Import] Excel parsed without header, contacts count:', contacts.length);
      } else {
        // Header exists
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
        
        // Use user-selected columns
        let nameField: string | null = null;
        let phoneField: string | null = null;
        
        // Find phone column
        if (phoneColumn) {
          // Exact match first
          if (availableKeys.includes(phoneColumn)) {
            phoneField = phoneColumn;
          } else {
            // Case-insensitive match
            phoneField = availableKeys.find(
              key => key.toLowerCase().trim() === phoneColumn.toLowerCase().trim()
            ) || null;
          }
        }
        
        // Find name column
        if (nameColumn) {
          if (availableKeys.includes(nameColumn)) {
            nameField = nameColumn;
          } else {
            nameField = availableKeys.find(
              key => key.toLowerCase().trim() === nameColumn.toLowerCase().trim()
            ) || null;
          }
        }
        
        // Log first row
        if (i === 0) {
          console.log('[Import] Available columns:', availableKeys);
          console.log('[Import] User selected nameColumn:', nameColumn, '-> found:', nameField);
          console.log('[Import] User selected phoneColumn:', phoneColumn, '-> found:', phoneField);
        }
        
        // Get values
        const name = nameField ? String(contactData[nameField] || '').trim() : '';
        let phoneRaw = phoneField ? String(contactData[phoneField] || '').trim() : '';
        
        // Handle empty string as null
        if (phoneRaw === '') {
          phoneRaw = '';
        }
        
        // Check if phone column was selected but value is empty
        if (!phoneRaw && phoneColumn) {
          results.failed++;
          results.errors.push(`Satır ${i + 1}: Seçilen telefon sütunu (${phoneColumn}) boş`);
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
        
        // Use selected groupId
        const finalGroupId = groupId || null;
        
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
