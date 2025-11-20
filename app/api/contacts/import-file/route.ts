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

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Dosya yüklenmedi' },
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
    } else if (isExcel) {
      // Excel parse
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileContent, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Try with header first (normal case)
      let contactsWithHeader = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Tüm değerleri string olarak al
        defval: '', // Boş hücreler için varsayılan değer
      });
      
      // If no header or first row doesn't look like headers, try without header
      if (contactsWithHeader.length === 0 || !Object.keys(contactsWithHeader[0] || {}).length) {
        // Try without header - treat first row as data
        contacts = XLSX.utils.sheet_to_json(worksheet, {
          header: ['numara'], // Sadece numara sütunu varsa, ona "numara" adını ver
          raw: false,
          defval: '',
        });
        console.log('[Import] Excel parsed without header, contacts count:', contacts.length);
      } else {
        contacts = contactsWithHeader;
        console.log('[Import] Excel parsed with header, contacts count:', contacts.length);
      }
      
      console.log('[Import] First contact sample:', contacts[0]);
      console.log('[Import] Available columns:', contacts.length > 0 ? Object.keys(contacts[0]) : []);
      
      // If contacts have numeric keys (like { '0': '5075708797' }), convert them
      if (contacts.length > 0 && Object.keys(contacts[0] || {}).some(key => /^\d+$/.test(key))) {
        console.log('[Import] Detected numeric column keys, converting...');
        contacts = contacts.map((contact: any) => {
          const newContact: any = {};
          const keys = Object.keys(contact);
          
          // If first column looks like phone, name it "numara"
          // If second column exists and looks like name, name it "isim"
          keys.forEach((key, index) => {
            const value = String(contact[key] || '').trim();
            if (!value) return;
            
            const cleanedValue = value.replace(/\D/g, '');
            
            if (cleanedValue.length >= 9 && cleanedValue.length <= 13) {
              // This looks like a phone number
              newContact['numara'] = value;
            } else if (index === 0 && keys.length === 1) {
              // Only one column, assume it's phone
              newContact['numara'] = value;
            } else if (index === 0) {
              // First column, assume it's name
              newContact['isim'] = value;
            } else if (index === 1) {
              // Second column, assume it's phone
              newContact['numara'] = value;
            } else {
              // Other columns
              newContact[`kolon${index + 1}`] = value;
            }
          });
          
          return newContact;
        });
        console.log('[Import] After conversion, first contact:', contacts[0]);
      }
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dosyada kişi bulunamadı' },
        { status: 400 }
      );
    }

    // Get existing contacts for this user using Supabase
    const { data: existingContacts } = await supabaseServer
      .from('contacts')
      .select('phone')
      .eq('user_id', auth.user.userId);

    const existingPhones = new Set((existingContacts || []).map((c: any) => c.phone));

    // Map CSV/Excel columns to contact fields
    // Support multiple column name variations
    const contactsToInsert: any[] = [];
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const contactData of contacts) {
      let phoneValue = 'Unknown';
      try {
        // Map column names (case-insensitive)
        // Try to find name field - support multiple variations
        const nameField = Object.keys(contactData).find(
          (key) => {
            const lowerKey = key.toLowerCase().trim();
            return lowerKey.includes('isim') || 
                   lowerKey.includes('name') || 
                   lowerKey.includes('ad') || 
                   lowerKey === 'isim' ||
                   lowerKey === 'name' ||
                   lowerKey === 'ad' ||
                   lowerKey === 'adı' ||
                   lowerKey === 'isimsoyisim';
          }
        );
        
        // Try to find phone field - support multiple variations
        const phoneField = Object.keys(contactData).find(
          (key) => {
            const lowerKey = key.toLowerCase().trim();
            return lowerKey.includes('telefon') || 
                   lowerKey.includes('phone') || 
                   lowerKey.includes('numara') ||
                   lowerKey.includes('tel') ||
                   lowerKey === 'telefon' ||
                   lowerKey === 'phone' ||
                   lowerKey === 'numara' ||
                   lowerKey === 'tel' ||
                   lowerKey === '5' || // Excel'de sütun başlığı "5" olabilir
                   lowerKey.startsWith('5'); // 5 ile başlayan sütun adları
          }
        );
        
        const emailField = Object.keys(contactData).find(
          (key) => {
            const lowerKey = key.toLowerCase().trim();
            return lowerKey.includes('email') || 
                   lowerKey.includes('e-posta') || 
                   lowerKey.includes('eposta') ||
                   lowerKey.includes('mail');
          }
        );
        
        const groupField = Object.keys(contactData).find(
          (key) => {
            const lowerKey = key.toLowerCase().trim();
            return lowerKey.includes('grup') || 
                   lowerKey.includes('group');
          }
        );
        
        const notesField = Object.keys(contactData).find(
          (key) => {
            const lowerKey = key.toLowerCase().trim();
            return lowerKey.includes('not') || 
                   lowerKey.includes('note') ||
                   lowerKey.includes('açıklama');
          }
        );

        // Log for debugging
        if (results.success + results.failed === 0) {
          console.log('[Import] Available columns:', Object.keys(contactData));
          console.log('[Import] Found nameField:', nameField);
          console.log('[Import] Found phoneField:', phoneField);
        }

        const name = nameField ? String(contactData[nameField] || '').trim() : '';
        let phoneRaw = phoneField ? String(contactData[phoneField] || '').trim() : '';
        
        // If phone field not found, try to get from any column that looks like a phone number
        if (!phoneRaw && phoneField) {
          const rawValue = contactData[phoneField];
          if (rawValue !== null && rawValue !== undefined) {
            // Convert to string and clean
            phoneRaw = String(rawValue).trim();
          }
        }
        
        // If still no phone, try all columns to find phone number
        if (!phoneRaw) {
          // First, try to find column with numeric values (could be phone numbers)
          for (const key of Object.keys(contactData)) {
            const value = String(contactData[key] || '').trim();
            if (!value) continue;
            
            // Clean value - remove non-digits
            const cleanedValue = value.replace(/\D/g, '');
            
            // If cleaned value is 9-12 digits, it's likely a phone number
            if (cleanedValue.length >= 9 && cleanedValue.length <= 13) {
              phoneRaw = value;
              console.log('[Import] Found phone in column:', key, '=', phoneRaw);
              break;
            }
          }
          
          // If still not found, try first column if it looks like a phone number
          if (!phoneRaw) {
            const firstKey = Object.keys(contactData)[0];
            if (firstKey) {
              const firstValue = String(contactData[firstKey] || '').trim();
              const cleanedFirstValue = firstValue.replace(/\D/g, '');
              if (cleanedFirstValue.length >= 9 && cleanedFirstValue.length <= 13) {
                phoneRaw = firstValue;
                console.log('[Import] Using first column as phone:', firstKey, '=', phoneRaw);
              }
            }
          }
        }
        
        phoneValue = phoneRaw || 'Unknown';
        const email = emailField ? String(contactData[emailField] || '').trim() : '';
        const notes = notesField ? String(contactData[notesField] || '').trim() : '';

        // If no name field found, use first column as name if it's not a phone number
        let finalName = name;
        if (!finalName) {
          // Try first column as name if it doesn't look like a phone number
          const firstKey = Object.keys(contactData)[0];
          if (firstKey) {
            const firstValue = String(contactData[firstKey] || '').trim();
            const cleanedFirstValue = firstValue.replace(/\D/g, '');
            // If first column is not a phone number, use it as name
            if (cleanedFirstValue.length < 9 || cleanedFirstValue.length > 13) {
              finalName = firstValue;
            }
          }
        }
        
        // If still no name, set default using phone number
        if (!finalName && phoneRaw) {
          const cleanedPhone = phoneRaw.replace(/\D/g, '');
          const last4Digits = cleanedPhone.length >= 4 
            ? cleanedPhone.substring(cleanedPhone.length - 4) 
            : cleanedPhone;
          finalName = `Kişi ${last4Digits}`;
          console.log('[Import] Using default name:', finalName, 'for phone:', phoneRaw);
        }
        
        // If still no name and no phone, try to get any non-empty value as name
        if (!finalName && !phoneRaw) {
          for (const key of Object.keys(contactData)) {
            const value = String(contactData[key] || '').trim();
            if (value) {
              // Check if it's not a phone number
              const cleanedValue = value.replace(/\D/g, '');
              if (cleanedValue.length < 9 || cleanedValue.length > 13) {
                finalName = value;
                break;
              } else {
                // It's a phone number, use it
                phoneRaw = value;
                const last4Digits = cleanedValue.length >= 4 
                  ? cleanedValue.substring(cleanedValue.length - 4) 
                  : cleanedValue;
                finalName = `Kişi ${last4Digits}`;
                break;
              }
            }
          }
        }

        // Final check - phone is required, name is optional (we'll use default)
        if (!phoneRaw) {
          results.failed++;
          results.errors.push(`Satır ${results.success + results.failed + 1}: Telefon numarası bulunamadı - Sütunlar: ${Object.keys(contactData).join(', ')} - Değerler: ${JSON.stringify(contactData)}`);
          console.log('[Import] Row failed - no phone:', { contactData, nameField, phoneField });
          continue;
        }
        
        // Ensure we have a name (required field)
        if (!finalName) {
          const cleanedPhone = phoneRaw.replace(/\D/g, '');
          const last4Digits = cleanedPhone.length >= 4 
            ? cleanedPhone.substring(cleanedPhone.length - 4) 
            : cleanedPhone;
          finalName = `Kişi ${last4Digits}`;
        }

        // Format phone number using formatPhoneNumber function
        // This will convert formats like 5075708797, 05075708797, etc. to 905075708797
        let phone: string;
        try {
          phone = formatPhoneNumber(phoneRaw);
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${phoneValue}: ${error.message || 'Geçersiz telefon formatı'}`);
          continue;
        }

        // Check if phone already exists (check with formatted number)
        if (existingPhones.has(phone)) {
          results.failed++;
          results.errors.push(`${phoneValue} (${phone}): Zaten kayıtlı`);
          continue;
        }

        // If group name is provided, find group ID
        let finalGroupId = groupId || null;
        if (groupField && contactData[groupField]) {
          const groupName = String(contactData[groupField] || '').trim();
          if (groupName) {
            // Find group by name
            const { data: groupData } = await supabaseServer
              .from('contact_groups')
              .select('id')
              .eq('user_id', auth.user.userId)
              .ilike('name', groupName)
              .limit(1)
              .single();

            if (groupData) {
              finalGroupId = groupData.id;
            }
          }
        }

        contactsToInsert.push({
          user_id: auth.user.userId,
          name: finalName,
          phone,
          email: email || null,
          notes: notes || null,
          group_id: finalGroupId,
        });

        existingPhones.add(phone);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${phoneValue}: ${error.message}`);
      }
    }

    // Bulk insert contacts using Supabase
    if (contactsToInsert.length > 0) {
      const { error: insertError } = await supabaseServer
        .from('contacts')
        .insert(contactsToInsert);

      if (insertError) {
        return NextResponse.json(
          { success: false, message: insertError.message || 'Kişiler import edilemedi' },
          { status: 500 }
        );
      }
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

    return NextResponse.json({
      success: true,
      message: `Import tamamlandı: ${results.success} başarılı, ${results.failed} başarısız`,
      data: results,
    });
  } catch (error: any) {
    console.error('Contacts import file error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Import hatası' },
      { status: 500 }
    );
  }
}

