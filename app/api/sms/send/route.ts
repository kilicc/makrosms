import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { sendSMS, formatPhoneNumber, sendBulkSMS } from '@/lib/utils/cepSMSProvider';

// Büyük gönderimler için timeout'u arttır (300 saniye = 5 dakika)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// POST /api/sms/send - Tekli SMS gönderimi
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, message, serviceName } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, message: 'Telefon numarası ve mesaj gerekli' },
        { status: 400 }
      );
    }

    // Telefon numaralarını parse et ve temizle
    const rawPhoneNumbers = phone.split(/[,\n]/).map((p: string) => p.trim()).filter((p: string) => p);
    
    // Her numarayı formatla ve geçersiz olanları filtrele
    const processedPhones: Array<{ original: string; formatted: string; error?: string }> = [];
    
    for (const rawPhone of rawPhoneNumbers) {
      try {
        const formattedPhone = formatPhoneNumber(rawPhone);
        processedPhones.push({ original: rawPhone, formatted: formattedPhone });
      } catch (error: any) {
        // Formatlama hatası - geçersiz numara, ama devam et (log'la)
        console.warn(`[SMS Send] Geçersiz telefon numarası formatı (atlanacak): ${rawPhone} - ${error.message}`);
        processedPhones.push({ 
          original: rawPhone, 
          formatted: rawPhone, 
          error: error.message 
        });
      }
    }
    
    // Geçerli formatlanmış numaraları al
    const validProcessedPhones = processedPhones.filter(p => !p.error);
    
    if (validProcessedPhones.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli telefon numarası bulunamadı. Lütfen numaraları kontrol edin.' },
        { status: 400 }
      );
    }
    
    // Formatlanmış numaraları al ve duplicate'leri temizle (Set kullanarak)
    const uniqueFormattedPhones = Array.from(new Set(validProcessedPhones.map(p => p.formatted)));
    
    // Duplicate'ler varsa bilgi ver
    const duplicateCount = validProcessedPhones.length - uniqueFormattedPhones.length;
    if (duplicateCount > 0) {
      console.log(`[SMS Send] ${duplicateCount} adet tekrar eden numara temizlendi`);
    }
    
    // Geçersiz numara sayısını logla
    const invalidCount = processedPhones.length - validProcessedPhones.length;
    if (invalidCount > 0) {
      console.log(`[SMS Send] ${invalidCount} adet geçersiz numara atlandı`);
    }
    
    // Son telefon numaraları listesi
    const phoneNumbers = uniqueFormattedPhones;
    
    console.log(`[SMS Send] Telefon numarası işleme özeti:`, {
      toplamGirdi: rawPhoneNumbers.length,
      geçerli: validProcessedPhones.length,
      tekrarEden: duplicateCount,
      geçersiz: invalidCount,
      sonuç: phoneNumbers.length
    });

    // Admin kullanıcıları için rol kontrolü
    const userRole = (auth.user.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'moderator' || userRole === 'administrator';

    // Get user to check credit using Supabase (admin değilse)
    let userCredit = 0;
    let requiredCredit = 0;
    let updatedUser: any = null;
    
    // Her numara için kredi hesaplama: Her numara = 1 SMS = 1 kredi (mesaj uzunluğuna göre değil)
    // 180 karakter = 1 kredi (mesaj), ancak her numara için ayrı SMS gönderildiği için numara sayısı kadar kredi düşülür
    const messageLength = message.length;
    const creditPerMessage = Math.ceil(messageLength / 180) || 1; // Mesaj başına kredi
    const totalCreditNeeded = creditPerMessage * phoneNumbers.length; // Toplam kredi = mesaj başına kredi * numara sayısı
    
    if (!isAdmin) {
      const { data: user, error: userError } = await supabaseServer
        .from('users')
        .select('credit')
        .eq('id', auth.user.userId)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { success: false, message: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }

      // Check credit - toplam kredi kontrolü
      requiredCredit = totalCreditNeeded;
      userCredit = user.credit || 0;
      
      if (userCredit < requiredCredit) {
        return NextResponse.json(
          {
            success: false,
            message: `Yetersiz kredi. Gerekli: ${requiredCredit} (${phoneNumbers.length} numara × ${creditPerMessage} kredi = ${requiredCredit} kredi), Mevcut: ${userCredit}`,
          },
          { status: 400 }
        );
      }

      // Kredi düş (başarılı veya başarısız olsun, kredi düşülecek, başarısız olursa 48 saat sonra iade edilecek)
      const { data: updatedUserData, error: updateError } = await supabaseServer
        .from('users')
        .update({ credit: Math.max(0, (userCredit || 0) - requiredCredit) })
        .eq('id', auth.user.userId)
        .select('credit')
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, message: updateError.message || 'Kredi güncellenemedi' },
          { status: 500 }
        );
      }
      
      updatedUser = updatedUserData;
    } else {
      // Admin kullanıcıları için kredi hesaplama (sadece cost için)
      requiredCredit = totalCreditNeeded;
    }

    // Büyük gönderimler için batch processing (100'er 100'er)
    const BATCH_SIZE = 100;
    const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;
    
    // Telefon numaralarını batch'lere böl
    const batches: string[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
      batches.push(phoneNumbers.slice(i, i + BATCH_SIZE));
    }

    console.log(`[SMS Send] Toplam ${phoneNumbers.length} numara, ${batches.length} batch halinde işlenecek`);

    // Her batch'i işle
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[SMS Send] Batch ${batchIndex + 1}/${batches.length} işleniyor (${batch.length} numara)`);
      
      // CepSMS API'sine toplu gönderim yap (batch içindeki tüm numaraları tek seferde gönder)
      const batchResults: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
      
      try {
        // CepSMS API'sine toplu gönderim için sendBulkSMS kullan
        const bulkResults = await sendBulkSMS(batch, message);
        
        // Sonuçları batch formatına çevir
        for (let i = 0; i < batch.length; i++) {
          const bulkResult = bulkResults[i] || { success: false, error: 'Sonuç bulunamadı' };
          batchResults.push({
            phone: batch[i],
            success: bulkResult.success,
            messageId: bulkResult.messageId,
            error: bulkResult.error,
          });
        }
        
        console.log(`[SMS Send] Batch ${batchIndex + 1}: Toplu gönderim tamamlandı - ${batchResults.filter(r => r.success).length} başarılı, ${batchResults.filter(r => !r.success).length} başarısız`);
      } catch (error: any) {
        // Toplu gönderim başarısız olursa, tek tek göndermeyi dene
        console.warn(`[SMS Send] Batch ${batchIndex + 1}: Toplu gönderim başarısız, tek tek gönderiliyor...`, error);
        
        // Fallback: Tek tek gönder
        for (const phoneNumber of batch) {
          try {
            const smsResult = await sendSMS(phoneNumber, message);
            batchResults.push({
              phone: phoneNumber,
              success: smsResult.success,
              messageId: smsResult.messageId,
              error: smsResult.error,
            });
            
            // Rate limiting için küçük bekleme
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (smsError: any) {
            batchResults.push({
              phone: phoneNumber,
              success: false,
              error: smsError.message || 'SMS gönderim hatası',
            });
          }
        }
      }
      
      results.push(...batchResults);
      
      // Batch sonuçlarını say
      for (const result of batchResults) {
        if (result.success && result.messageId) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Her batch sonrası başarılı gönderimleri bulk insert yap
      const successfulBatchSends = batchResults.filter((r) => r.success && r.messageId);
      if (successfulBatchSends.length > 0 && auth.user) {
        const bulkInsertData = successfulBatchSends.map((result) => ({
          user_id: auth.user!.userId,
          phone_number: result.phone,
          message,
          sender: serviceName || null,
          status: 'gönderildi',
          cost: isAdmin ? 0 : creditPerMessage,
          cep_sms_message_id: result.messageId,
          sent_at: new Date().toISOString(),
        }));
        
        // Bulk insert (her batch için)
        await supabaseServer
          .from('sms_messages')
          .insert(bulkInsertData);
        
        console.log(`[SMS Send] Batch ${batchIndex + 1}: ${successfulBatchSends.length} SMS kaydedildi`);
      }

      // Her batch sonrası başarısız gönderimleri kaydet ve iade oluştur (bulk)
      const failedBatchSends = batchResults.filter((r) => !r.success);
      if (failedBatchSends.length > 0 && !isAdmin && auth.user) {
        // Başarısız SMS'lerin detaylarını logla
        console.log(`[SMS Send] Batch ${batchIndex + 1}: ${failedBatchSends.length} başarısız SMS tespit edildi:`, 
          failedBatchSends.map(r => ({ phone: r.phone, error: r.error }))
        );
        
        // Önce başarısız SMS'leri bulk insert yap
        const bulkFailedData = failedBatchSends.map((result) => ({
          user_id: auth.user!.userId,
          phone_number: result.phone,
          message,
          sender: serviceName || null,
          status: 'failed',
          cost: creditPerMessage,
          failed_at: new Date().toISOString(),
          // Error mesajını service_name veya sender field'ında saklayalım (eğer yoksa)
          // Ya da refund reason'da detaylı gösterelim
        }));
        
        const { data: failedSmsDataArray, error: failedInsertError } = await supabaseServer
          .from('sms_messages')
          .insert(bulkFailedData)
          .select();
        
        if (failedInsertError) {
          console.error(`[SMS Send] Batch ${batchIndex + 1}: Başarısız SMS kayıt hatası:`, failedInsertError);
        }
        
        if (!failedInsertError && failedSmsDataArray && failedSmsDataArray.length > 0) {
          // Her başarısız SMS için iade oluştur (bulk) - error mesajını reason'da detaylı göster
          const bulkRefundData = failedSmsDataArray.map((failedSmsData, index) => {
            const errorDetail = failedBatchSends[index].error || 'Bilinmeyen hata';
            return {
              user_id: auth.user!.userId,
              sms_id: failedSmsData.id,
              original_cost: creditPerMessage,
              refund_amount: creditPerMessage,
              reason: `SMS gönderim başarısız - Otomatik iade (48 saat) - Telefon: ${failedBatchSends[index].phone} - Hata: ${errorDetail}`,
              status: 'pending',
            };
          });
          
          const { error: refundError } = await supabaseServer
            .from('refunds')
            .insert(bulkRefundData);
          
          if (refundError) {
            console.error(`[SMS Send] Batch ${batchIndex + 1}: İade oluşturma hatası:`, refundError);
          } else {
            console.log(`[SMS Send] Batch ${batchIndex + 1}: ${failedBatchSends.length} başarısız SMS kaydedildi ve iade oluşturuldu`);
          }
        } else {
          console.error(`[SMS Send] Batch ${batchIndex + 1}: Başarısız SMS'ler kaydedilemedi!`);
        }
      }
    }

    console.log(`[SMS Send] Tamamlandı: ${successCount} başarılı, ${failCount} başarısız`);

    // Sonuç mesajı
    if (successCount === phoneNumbers.length) {
      // Tüm SMS'ler başarılı
      return NextResponse.json({
        success: true,
        message: `${successCount} adet SMS başarıyla gönderildi`,
        data: {
          totalSent: successCount,
          totalFailed: failCount,
          remainingCredit: isAdmin ? null : (updatedUser ? updatedUser.credit : 0),
          results,
        },
      });
    } else if (successCount > 0) {
      // Kısmen başarılı
      return NextResponse.json({
        success: true,
        message: `${successCount} adet SMS gönderildi, ${failCount} adet başarısız. Başarısız mesajlar için kredi 48 saat içinde otomatik iade edilecektir.`,
        data: {
          totalSent: successCount,
          totalFailed: failCount,
          remainingCredit: isAdmin ? null : (updatedUser ? updatedUser.credit : 0),
          results,
        },
      });
    } else {
      // Tüm SMS'ler başarısız - kredi iade edilecek
      return NextResponse.json(
        {
          success: false,
          message: `SMS gönderim başarısız. ${failCount} adet mesaj gönderilemedi. Kredi 48 saat içinde otomatik iade edilecektir.`,
          data: {
            totalSent: successCount,
            totalFailed: failCount,
            remainingCredit: isAdmin ? null : (updatedUser ? updatedUser.credit : 0),
            results,
          },
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS gönderim hatası' },
      { status: 500 }
    );
  }
}

