import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { sendSMS, formatPhoneNumber, sendBulkSMS } from '@/lib/utils/cepSMSProvider';
import { createSMSJob, updateProgress, generateJobId, saveResults } from '@/lib/utils/smsProgress';
import { getSystemCredit, deductFromSystemCredit, checkSystemCredit } from '@/lib/utils/systemCredit';

// Büyük gönderimler için timeout'u arttır (600 saniye = 10 dakika)
// CepSMS API: 50,000 SMS / 10 dakika = ~83 SMS/saniye
export const maxDuration = 600;
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
      // Normal kullanıcılar için sistem kredisinden (admin kredisinden) kontrol ve düş
      requiredCredit = totalCreditNeeded;
      
      // Sistem kredisini kontrol et (admin kredisi)
      const systemCreditAvailable = await checkSystemCredit(requiredCredit);
      
      if (!systemCreditAvailable) {
        const currentSystemCredit = await getSystemCredit();
        return NextResponse.json(
          {
            success: false,
            message: `Yetersiz sistem kredisi. Gerekli: ${requiredCredit} (${phoneNumbers.length} numara × ${creditPerMessage} kredi = ${requiredCredit} kredi), Mevcut Sistem Kredisi: ${currentSystemCredit}`,
          },
          { status: 400 }
        );
      }

      // Sistem kredisinden düş (başarılı veya başarısız olsun, kredi düşülecek, başarısız olursa 48 saat sonra iade edilecek)
      console.log(`[SMS Send] Sistem kredisinden ${requiredCredit} kredi düşülüyor...`);
      const currentCreditBefore = await getSystemCredit();
      console.log(`[SMS Send] Mevcut sistem kredisi: ${currentCreditBefore}`);
      
      const deducted = await deductFromSystemCredit(requiredCredit);
      
      if (!deducted) {
        console.error(`[SMS Send] Sistem kredisi düşülemedi!`);
        return NextResponse.json(
          { success: false, message: 'Sistem kredisi güncellenemedi' },
          { status: 500 }
        );
      }
      
      const currentCreditAfter = await getSystemCredit();
      console.log(`[SMS Send] Sistem kredisi düşürüldü: ${currentCreditBefore} -> ${currentCreditAfter} (${requiredCredit} kredi düşüldü)`);

      // Normal kullanıcının kendi kredisini de güncelle (gösterim için - sistem kredisinden farklı tutulabilir veya 0 yapılabilir)
      // Şimdilik sadece sistem kredisinden düşüyoruz, kullanıcının kendi kredisi gösterilmez
    } else {
      // Admin kullanıcıları için sistem kredisinden düş (adminler sistem kredisini kullanır)
      requiredCredit = totalCreditNeeded;
      
      // Sistem kredisini kontrol et
      const systemCreditAvailable = await checkSystemCredit(requiredCredit);
      
      if (!systemCreditAvailable) {
        const currentSystemCredit = await getSystemCredit();
        return NextResponse.json(
          {
            success: false,
            message: `Yetersiz sistem kredisi. Gerekli: ${requiredCredit}, Mevcut Sistem Kredisi: ${currentSystemCredit}`,
          },
          { status: 400 }
        );
      }

      // Sistem kredisinden düş
      console.log(`[SMS Send] Admin: Sistem kredisinden ${requiredCredit} kredi düşülüyor...`);
      const currentCreditBefore = await getSystemCredit();
      console.log(`[SMS Send] Admin: Mevcut sistem kredisi: ${currentCreditBefore}`);
      
      const deducted = await deductFromSystemCredit(requiredCredit);
      
      if (!deducted) {
        console.error(`[SMS Send] Admin: Sistem kredisi düşülemedi!`);
        return NextResponse.json(
          { success: false, message: 'Sistem kredisi güncellenemedi' },
          { status: 500 }
        );
      }
      
      const currentCreditAfter = await getSystemCredit();
      console.log(`[SMS Send] Admin: Sistem kredisi düşürüldü: ${currentCreditBefore} -> ${currentCreditAfter} (${requiredCredit} kredi düşüldü)`);
    }

    // CepSMS API rate limiting: 500 kişiye gönderirken bad request hatası alınıyor
    // Batch size'ı küçültüp rate limiting ekleyerek daha yavaş gönderelim
    const BATCH_SIZE = 50; // Küçük batch'ler (500'den 50'ye düşürüldü)
    const CONCURRENT_LIMIT = 10; // Düşük concurrent limit (rate limiting için)
    const RATE_LIMIT_DELAY = 50; // Her batch arasında 50ms bekle (rate limiting)
    const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;
    
    // Telefon numaralarını batch'lere böl
    const batches: string[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
      batches.push(phoneNumbers.slice(i, i + BATCH_SIZE));
    }

    console.log(`[SMS Send] Toplam ${phoneNumbers.length} numara, ${batches.length} batch halinde işlenecek (Batch size: ${BATCH_SIZE}, Concurrent: ${CONCURRENT_LIMIT})`);

    // Tüm gönderimler için progress tracking
    const jobId = generateJobId();
    createSMSJob(jobId, phoneNumbers.length, batches.length);
    updateProgress(jobId, { status: 'processing' });
    console.log(`[SMS Send] Progress tracking başlatıldı - Job ID: ${jobId}`);

    // Her batch'i işle
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[SMS Send] Batch ${batchIndex + 1}/${batches.length} işleniyor (${batch.length} numara)`);
      
      const batchResults: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
      
      // Paralel olarak gönder (rate limiting ile)
      for (let i = 0; i < batch.length; i += CONCURRENT_LIMIT) {
        const concurrentBatch = batch.slice(i, i + CONCURRENT_LIMIT);
        const concurrentPromises = concurrentBatch.map(async (phoneNumber, idx) => {
          try {
            // Her SMS arasında küçük bir delay (rate limiting)
            if (idx > 0) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            const smsResult = await sendSMS(phoneNumber, message);
            return {
              phone: phoneNumber,
              success: smsResult.success,
              messageId: smsResult.messageId,
              error: smsResult.error,
            };
          } catch (error: any) {
            console.error(`[SMS Send] Batch ${batchIndex + 1}: SMS gönderim exception - ${phoneNumber}:`, error);
            return {
              phone: phoneNumber,
              success: false,
              error: error.message || 'SMS gönderim hatası',
            };
          }
        });
        
        const concurrentResults = await Promise.all(concurrentPromises);
        batchResults.push(...concurrentResults);
        
        // Rate limiting: Her concurrent batch sonrası bekleme
        if (i + CONCURRENT_LIMIT < batch.length) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }
      }
      
      // Her batch sonrası daha uzun bir bekleme (CepSMS rate limit'i için)
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`[SMS Send] Batch ${batchIndex + 1}: Tamamlandı - ${batchResults.filter(r => r.success).length} başarılı, ${batchResults.filter(r => !r.success).length} başarısız`);
      
      results.push(...batchResults);
      
      // Batch sonuçlarını say
      for (const result of batchResults) {
        if (result.success && result.messageId) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Progress güncelle
      updateProgress(jobId, {
        completed: results.length,
        successCount,
        failCount,
        currentBatch: batchIndex + 1,
      });
      console.log(`[SMS Send] Progress: ${results.length}/${phoneNumbers.length} (${Math.round((results.length / phoneNumbers.length) * 100)}%)`);

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

    // Progress'i tamamlandı olarak işaretle
    saveResults(jobId, results);
    updateProgress(jobId, {
      status: successCount === phoneNumbers.length ? 'completed' : (successCount > 0 ? 'completed' : 'failed'),
      completed: results.length,
      successCount,
      failCount,
      currentBatch: batches.length,
    });

    // Sistem kredisini al (gösterim için)
    const currentSystemCredit = await getSystemCredit();

    // Sonuç mesajı
    if (successCount === phoneNumbers.length) {
      // Tüm SMS'ler başarılı
      return NextResponse.json({
        success: true,
        message: `${successCount} adet SMS başarıyla gönderildi`,
        data: {
          totalSent: successCount,
          totalFailed: failCount,
          remainingCredit: currentSystemCredit, // Sistem kredisi (admin kredisi)
          results: phoneNumbers.length >= 100 ? undefined : results, // 100+ gönderimlerde results göndermeyelim (çok büyük olabilir)
          jobId, // Tüm gönderimlerde job ID gönder
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
          remainingCredit: currentSystemCredit,
          results: jobId ? undefined : results, // Büyük gönderimlerde results göndermeyelim
          jobId, // Büyük gönderimlerde job ID gönder
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
            remainingCredit: currentSystemCredit,
            results: jobId ? undefined : results, // Büyük gönderimlerde results göndermeyelim
            jobId, // Büyük gönderimlerde job ID gönder
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

