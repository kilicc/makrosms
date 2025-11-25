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
    const groupIdRaw = formData.get('groupId') as string | null;
    const nameColumn = formData.get('nameColumn') as string | null;
    const phoneColumn = formData.get('phoneColumn') as string | null;
    
    // Normalize groupId: empty string, null, or undefined becomes null
    let groupId: string | null = null;
    if (groupIdRaw) {
      const trimmed = groupIdRaw.toString().trim();
      if (trimmed !== '') {
        groupId = trimmed;
      }
    }

    console.log('[Import] Received params - raw:', { 
      groupIdRaw, 
      groupIdRawType: typeof groupIdRaw,
      nameColumn, 
      phoneColumn 
    });
    console.log('[Import] Received params - normalized:', { 
      groupId, 
      groupIdType: typeof groupId,
      nameColumn, 
      phoneColumn 
    });

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
        // Önce tüm veriyi array of arrays olarak oku
        const allData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Array of arrays
          raw: false,
          defval: '',
        });
        
        console.log('[Import] Excel parsed as array of arrays, total rows:', allData.length);
        
        if (allData.length > 0) {
          // İlk satırı kontrol et - eğer telefon numarası gibi görünüyorsa header değildir
          const firstRow = allData[0] as any[];
          const firstRowValues = firstRow.filter(v => String(v || '').trim());
          
          // İlk satırın telefon numarası olup olmadığını kontrol et
          const isFirstRowPhoneNumbers = firstRowValues.length > 0 && firstRowValues.every((val: any) => {
            const cleaned = String(val || '').replace(/\D/g, '');
            return cleaned.length >= 9 && cleaned.length <= 13;
          });
          
          if (isFirstRowPhoneNumbers && firstRowValues.length === 1) {
            // İlk satır telefon numarası ise, header yok demektir
            // Tek sütunlu telefon numaraları listesi
            console.log('[Import] Detected single column phone numbers without header');
            detectedColumns = ['Telefon'];
            contacts = allData.map((row: any[]) => {
              const phoneValue = String(row[0] || '').trim();
              return { 'Telefon': phoneValue };
            });
          } else {
            // İlk satırı header olarak kullan, gerisini veri
            const headerRow = firstRow.map((val, idx) => {
              const valStr = String(val || '').trim();
              return valStr || `Sütun ${idx + 1}`;
            });
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
          // Boş dosya
          contacts = [];
          detectedColumns = [];
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

    // Get existing contacts for this user (with phone and group_id)
    const { data: existingContacts } = await supabaseServer
      .from('contacts')
      .select('phone, group_id')
      .eq('user_id', auth.user.userId);

    const existingPhones = new Set((existingContacts || []).map((c: any) => c.phone));
    // Map of phone -> contact data for updates
    const existingContactsMap = new Map((existingContacts || []).map((c: any) => [c.phone, c]));
    
    // Track phones processed in this batch to prevent duplicates within the same import
    const processedPhonesInBatch = new Set<string>();

    const contactsToInsert: any[] = [];
    const contactsToUpdate: Array<{ phone: string; group_id: string | null }> = [];
    const results = {
      success: 0,
      failed: 0,
      skipped: 0, // Skipped due to duplicates or already exists
      skippedExisting: 0, // Already exists in database
      skippedDuplicate: 0, // Duplicate in this file
      updated: 0, // Updated existing contacts with group
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
        
        // Check if phone already exists in database
        if (existingPhones.has(phone)) {
          // If group is selected and contact exists, update group if different
          if (groupId) {
            const existingContact = existingContactsMap.get(phone);
            if (existingContact && existingContact.group_id !== groupId) {
              // Group is different, add to update list
              contactsToUpdate.push({ phone, group_id: groupId });
              results.updated++;
              // Mark as processed to prevent duplicates
              processedPhonesInBatch.add(phone);
              existingPhones.add(phone);
              continue;
            } else if (existingContact && existingContact.group_id === groupId) {
              // Already in the same group, skip
              results.skipped++;
              results.skippedExisting++;
              continue;
            }
          } else {
            // No group selected, just skip
            results.skipped++;
            results.skippedExisting++;
            continue;
          }
        }
        
        // Check if phone is duplicate within this import batch
        if (processedPhonesInBatch.has(phone)) {
          results.skipped++;
          results.skippedDuplicate++;
          continue;
        }
        
        // Use normalized groupId (already handled at top)
        const contactToInsert = {
          user_id: auth.user.userId,
          name: finalName,
          phone,
          email: null,
          notes: null,
          group_id: groupId,
        };
        
        // Debug: Log first contact's group_id
        if (i === 0) {
          console.log('[Import] First contact being inserted:', {
            name: finalName,
            phone,
            group_id: groupId,
            group_id_type: typeof groupId
          });
        }
        
        contactsToInsert.push(contactToInsert);
        
        // Mark this phone as processed in this batch
        processedPhonesInBatch.add(phone);
        // Also add to existingPhones to prevent duplicates in subsequent rows
        existingPhones.add(phone);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Satır ${i + 1}: ${phoneValue} - ${error.message || 'Bilinmeyen hata'}`);
      }
    }

    // Update existing contacts with group if groupId is provided
    if (contactsToUpdate.length > 0 && groupId) {
      console.log('[Import] Updating', contactsToUpdate.length, 'existing contacts with group:', groupId);
      
      // Update contacts in batches to avoid too many queries
      const batchSize = 100;
      for (let i = 0; i < contactsToUpdate.length; i += batchSize) {
        const batch = contactsToUpdate.slice(i, i + batchSize);
        const phones = batch.map(c => c.phone);
        
        const { error: updateError } = await supabaseServer
          .from('contacts')
          .update({ group_id: groupId })
          .eq('user_id', auth.user.userId)
          .in('phone', phones);
        
        if (updateError) {
          console.error('[Import] Update error for batch:', updateError);
          results.errors.push(`Grup güncelleme hatası: ${updateError.message}`);
        }
      }
      
      console.log('[Import] ✅ Updated', contactsToUpdate.length, 'contacts with group');
    }

    // Bulk insert contacts
    if (contactsToInsert.length > 0) {
      // Final duplicate check: Remove any duplicates from contactsToInsert array
      const seenPhones = new Set<string>();
      const uniqueContactsToInsert: any[] = [];
      const duplicatePhonesInArray: string[] = [];
      
      for (const contact of contactsToInsert) {
        if (seenPhones.has(contact.phone)) {
          // Duplicate found in array - skip it
          duplicatePhonesInArray.push(contact.phone);
          results.failed++;
          continue;
        }
        seenPhones.add(contact.phone);
        uniqueContactsToInsert.push(contact);
      }
      
      if (duplicatePhonesInArray.length > 0) {
        console.warn('[Import] Found duplicates in contactsToInsert array:', duplicatePhonesInArray.slice(0, 5));
        results.errors.push(`${duplicatePhonesInArray.length} duplicate telefon numarası array içinde tespit edildi ve filtrelendi`);
      }
      
      // Update results.success to reflect actual unique contacts
      results.success = uniqueContactsToInsert.length;
      
      console.log('[Import] Inserting', uniqueContactsToInsert.length, 'unique contacts (filtered from', contactsToInsert.length, 'total)');
      console.log('[Import] GroupId being used:', groupId);
      if (uniqueContactsToInsert.length > 0) {
        console.log('[Import] First contact sample:', JSON.stringify(uniqueContactsToInsert[0], null, 2));
        console.log('[Import] Sample contacts with group_id:', uniqueContactsToInsert.slice(0, 3).map(c => ({ name: c.name, phone: c.phone, group_id: c.group_id })));
      }
      
      if (uniqueContactsToInsert.length === 0) {
        let skipMessage = '';
        if (results.skippedExisting > 0) {
          skipMessage += `${results.skippedExisting} numara veritabanında zaten kayıtlı`;
        }
        if (results.skippedDuplicate > 0) {
          if (skipMessage) skipMessage += ', ';
          skipMessage += `${results.skippedDuplicate} numara dosyada duplicate`;
        }
        
        return NextResponse.json({
          success: true,
          message: `Import tamamlandı: Tüm ${contacts.length} numara atlandı. ${skipMessage}. ${results.success} başarılı, ${results.failed} başarısız`,
          data: results,
        });
      }
      
      const { error: insertError } = await supabaseServer
        .from('contacts')
        .insert(uniqueContactsToInsert);

      if (insertError) {
        console.error('[Import] Insert error:', insertError);
        
        // Check if it's a duplicate key error
        if (insertError.message && insertError.message.includes('duplicate key') && insertError.message.includes('contacts_user_id_phone_key')) {
          // Bulk insert failed due to duplicate key - try inserting one by one
          console.warn('[Import] Bulk insert failed due to duplicate key, trying individual inserts...');
          
          // Re-check existing phones before individual inserts (in case they were added during processing)
          const { data: currentExistingContacts } = await supabaseServer
            .from('contacts')
            .select('phone')
            .eq('user_id', auth.user.userId);
          
          const currentExistingPhones = new Set((currentExistingContacts || []).map((c: any) => c.phone));
          
          let individualSuccess = 0;
          let individualFailed = 0;
          const individualErrors: string[] = [];
          const duplicatePhonesFound: string[] = [];
          
          // Try inserting each contact individually
          for (const contact of uniqueContactsToInsert) {
            // Check again if phone exists
            if (currentExistingPhones.has(contact.phone)) {
              individualFailed++;
              duplicatePhonesFound.push(contact.phone);
              continue;
            }
            
            try {
              const { error: individualError } = await supabaseServer
                .from('contacts')
                .insert(contact);
              
              if (individualError) {
                if (individualError.message && individualError.message.includes('duplicate key')) {
                  // Already exists - skip silently
                  individualFailed++;
                  duplicatePhonesFound.push(contact.phone);
                  currentExistingPhones.add(contact.phone); // Add to set to prevent future duplicates
                } else {
                  individualFailed++;
                  individualErrors.push(`${contact.phone}: ${individualError.message}`);
                }
              } else {
                individualSuccess++;
                currentExistingPhones.add(contact.phone); // Add to set to prevent future duplicates
              }
            } catch (err: any) {
              individualFailed++;
              individualErrors.push(`${contact.phone}: ${err.message || 'Bilinmeyen hata'}`);
            }
          }
          
          // Update results
          results.success = individualSuccess;
          results.failed = individualFailed;
          results.skipped = results.skipped + duplicatePhonesFound.length;
          results.skippedExisting = results.skippedExisting + duplicatePhonesFound.length;
          
          if (duplicatePhonesFound.length > 0) {
            results.errors.push(`${duplicatePhonesFound.length} numara zaten kayıtlı: ${duplicatePhonesFound.slice(0, 5).join(', ')}${duplicatePhonesFound.length > 5 ? '...' : ''}`);
          }
          results.errors = [...results.errors, ...individualErrors];
          
          // Build message
          let messageParts: string[] = [];
          if (individualSuccess > 0) {
            messageParts.push(`${individualSuccess} başarılı`);
          }
          if (individualFailed > 0) {
            messageParts.push(`${individualFailed} atlandı`);
          }
          
          return NextResponse.json({
            success: true,
            message: `Import tamamlandı: ${messageParts.join(', ')} (${duplicatePhonesFound.length} zaten kayıtlı)`,
            data: results,
          });
        }
        
        return NextResponse.json(
          { success: false, message: insertError.message || 'Kişiler import edilemedi' },
          { status: 500 }
        );
      }
      
      // Verify that contacts were inserted with correct group_id
      if (groupId) {
        const { data: insertedContacts, error: verifyError } = await supabaseServer
          .from('contacts')
          .select('id, name, phone, group_id')
          .eq('user_id', auth.user.userId)
          .eq('group_id', groupId)
          .in('phone', contactsToInsert.map(c => c.phone).slice(0, 5)); // Check first 5
        
        if (!verifyError && insertedContacts) {
          console.log('[Import] ✅ Verified inserted contacts with group_id:', insertedContacts.length, 'contacts found');
        } else {
          console.error('[Import] ⚠️ Verification error:', verifyError);
        }
      }
      
      // Update group contact count if groupId exists
      if (groupId && (results.success > 0 || results.updated > 0)) {
        console.log('[Import] Updating group count for groupId:', groupId);
        // Recalculate actual count from database
        const { count } = await supabaseServer
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', auth.user.userId)
          .eq('group_id', groupId);

        const actualCount = count || 0;
        
        const { data: groupData } = await supabaseServer
          .from('contact_groups')
          .select('contact_count')
          .eq('id', groupId)
          .single();

        if (groupData && groupData.contact_count !== actualCount) {
          await supabaseServer
            .from('contact_groups')
            .update({ contact_count: actualCount })
            .eq('id', groupId);
          console.log('[Import] ✅ Updated group count to:', actualCount);
        }
      }
    }

    // Build final message
    let messageParts: string[] = [];
    if (results.success > 0) {
      messageParts.push(`${results.success} yeni kişi eklendi`);
    }
    if (results.updated > 0) {
      messageParts.push(`${results.updated} kişi gruba eklendi`);
    }
    if (results.failed > 0) {
      messageParts.push(`${results.failed} başarısız`);
    }
    if (results.skipped > 0) {
      let skipDetails: string[] = [];
      if (results.skippedExisting > 0) {
        skipDetails.push(`${results.skippedExisting} zaten aynı grupta`);
      }
      if (results.skippedDuplicate > 0) {
        skipDetails.push(`${results.skippedDuplicate} duplicate`);
      }
      if (skipDetails.length > 0) {
        messageParts.push(`${results.skipped} atlandı (${skipDetails.join(', ')})`);
      } else {
        messageParts.push(`${results.skipped} atlandı`);
      }
    }
    
    const finalMessage = messageParts.length > 0 
      ? `Import tamamlandı: ${messageParts.join(', ')}`
      : `Import tamamlandı: ${results.success} başarılı, ${results.failed} başarısız`;

    return NextResponse.json({
      success: true,
      message: finalMessage,
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
