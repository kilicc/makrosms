import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { authenticateApiKey } from '@/lib/middleware/apiKeyAuth';
import { sendSMS, formatPhoneNumber } from '@/lib/utils/cepSMSProvider';
import { createSMSJob, updateProgress, generateJobId, saveResults } from '@/lib/utils/smsProgress';
import { getSystemCredit, deductFromSystemCredit, checkSystemCredit } from '@/lib/utils/systemCredit';
import { logSendRequest, logSendResponse, logSendError, logCreditDeduction, logDatabaseOperation } from '@/lib/utils/smsLogger';

// Büyük gönderimler için timeout'u arttır (3600 saniye = 1 saat)
// 50,000 SMS için yaklaşık 40-50 dakika gerekiyor
export const maxDuration = 3600;
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/sms/send-advanced
 * CepSMS formatına benzer gelişmiş SMS gönderimi
 * 
 * Request (JSON):
 * {
 *   "From": "Baslik",
 *   "User": "API_KEY",
 *   "Pass": "API_SECRET",
 *   "Message": "selam test",
 *   "Coding": "default", (default or turkish)
 *   "StartDate": null,
 *   "ValidityPeriod": 1140,
 *   "Numbers": ["905321234567"]
 * }
 * 
 * Response:
 * {
 *   "MessageId": "uuid",
 *   "Status": "OK"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // API Key authentication
    const auth = await authenticateApiKey(request);
    
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        {
          MessageId: 0,
          Status: 'Error',
          Error: auth.error || 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { From, Message, Coding, StartDate, ValidityPeriod, Numbers } = body;
    
    // IP adresi ve User-Agent bilgilerini al (loglama için)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validation
    if (!Message || !Numbers || !Array.isArray(Numbers) || Numbers.length === 0) {
      return NextResponse.json(
        {
          MessageId: 0,
          Status: 'Error',
          Error: 'Message ve Numbers (array) gerekli',
        },
        { status: 400 }
      );
    }

    // Telefon numarası validasyonu
    const phoneNumbers = Numbers.map((num: string) => {
      try {
        return formatPhoneNumber(num);
      } catch (error: any) {
        throw new Error(`Geçersiz telefon numarası: ${num}`);
      }
    });

    // Kredi kontrolü (admin değilse)
    const userRole = (auth.user.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'moderator' || userRole === 'administrator';

    const supabaseServer = getSupabaseServer();
    let userCredit = 0;
    let requiredCredit = 0;

    // Normal kullanıcılar için hem kullanıcı kredisinden hem de sistem kredisinden (admin kredisinden) kontrol ve düş
    const messageLength = Message.length;
    requiredCredit = Math.ceil(messageLength / 180) || 1;
    const totalRequiredCredit = phoneNumbers.length * requiredCredit;

    if (!isAdmin) {
      // Önce kullanıcının kendi kredisini kontrol et
      const { data: user, error: userError } = await supabaseServer
        .from('users')
        .select('credit')
        .eq('id', auth.user.id)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: 'Kullanıcı bulunamadı',
          },
          { status: 404 }
        );
      }

      userCredit = user.credit || 0;
      
      // Kullanıcının kendi kredisini kontrol et
      if (userCredit < totalRequiredCredit) {
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: `Yetersiz kredi. Gerekli: ${totalRequiredCredit}, Mevcut Krediniz: ${userCredit}`,
          },
          { status: 400 }
        );
      }

      // Sistem kredisini kontrol et (admin kredisi - tüm kullanıcıların toplam limiti)
      const systemCreditAvailable = await checkSystemCredit(totalRequiredCredit);
      
      if (!systemCreditAvailable) {
        const currentSystemCredit = await getSystemCredit();
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: `Sistem kredisi yetersiz. Gerekli: ${totalRequiredCredit}, Mevcut Sistem Kredisi: ${currentSystemCredit}`,
          },
          { status: 400 }
        );
      }

      // Önce kullanıcının kendi kredisinden düş
      console.log(`[Advanced SMS Send] Kullanıcı kredisinden ${totalRequiredCredit} kredi düşülüyor...`);
      console.log(`[Advanced SMS Send] Kullanıcı kredisi: ${userCredit} -> ${userCredit - totalRequiredCredit}`);
      
      const { data: updatedUserData, error: updateError } = await supabaseServer
        .from('users')
        .update({ credit: Math.max(0, userCredit - totalRequiredCredit) })
        .eq('id', auth.user.id)
        .select('credit')
        .single();

      if (updateError) {
        console.error(`[Advanced SMS Send] Kullanıcı kredisi düşülemedi!`, updateError);
        // Log error
        await logCreditDeduction({
          userId: auth.user.id,
          amount: totalRequiredCredit,
          beforeCredit: userCredit,
          afterCredit: userCredit,
          metadata: { error: updateError.message, phoneCount: phoneNumbers.length },
        });
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: updateError.message || 'Kredi güncellenemedi',
          },
          { status: 500 }
        );
      }

      // Sonra sistem kredisinden düş (admin kredisinden - tüm kullanıcıların toplam limiti)
      console.log(`[Advanced SMS Send] Sistem kredisinden ${totalRequiredCredit} kredi düşülüyor...`);
      const currentCreditBefore = await getSystemCredit();
      console.log(`[Advanced SMS Send] Mevcut sistem kredisi: ${currentCreditBefore}`);
      
      const deducted = await deductFromSystemCredit(totalRequiredCredit);
      
      if (!deducted) {
        console.error(`[Advanced SMS Send] Sistem kredisi düşülemedi! Kullanıcı kredisi iade ediliyor...`);
        // Sistem kredisi düşülemedi, kullanıcı kredisini geri yükle
        await supabaseServer
          .from('users')
          .update({ credit: userCredit })
          .eq('id', auth.user.id);
        
        // Log error
        await logCreditDeduction({
          userId: auth.user.id,
          amount: totalRequiredCredit,
          beforeCredit: userCredit,
          afterCredit: userCredit,
          systemCreditBefore: currentCreditBefore,
          systemCreditAfter: currentCreditBefore,
          metadata: { error: 'Sistem kredisi düşülemedi, iade edildi', phoneCount: phoneNumbers.length },
        });
        
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: 'Sistem kredisi güncellenemedi, kredi iade edildi',
          },
          { status: 500 }
        );
      }
      
      const currentCreditAfter = await getSystemCredit();
      console.log(`[Advanced SMS Send] Sistem kredisi düşürüldü: ${currentCreditBefore} -> ${currentCreditAfter} (${totalRequiredCredit} kredi düşüldü)`);
      
      // Log successful credit deduction
      await logCreditDeduction({
        userId: auth.user.id,
        amount: totalRequiredCredit,
        beforeCredit: userCredit,
        afterCredit: updatedUserData?.credit || (userCredit - totalRequiredCredit),
        systemCreditBefore: currentCreditBefore,
        systemCreditAfter: currentCreditAfter,
        metadata: { phoneCount: phoneNumbers.length, creditPerMessage: requiredCredit, messageLength: Message.length },
      });
    } else {
      // Admin kullanıcıları için sadece sistem kredisinden düş
      const systemCreditAvailable = await checkSystemCredit(totalRequiredCredit);
      
      if (!systemCreditAvailable) {
        const currentSystemCredit = await getSystemCredit();
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: `Yetersiz sistem kredisi. Gerekli: ${totalRequiredCredit}, Mevcut Sistem Kredisi: ${currentSystemCredit}`,
          },
          { status: 400 }
        );
      }

      const deducted = await deductFromSystemCredit(totalRequiredCredit);
      
      if (!deducted) {
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: 'Sistem kredisi güncellenemedi',
          },
          { status: 500 }
        );
      }
    }

    // CepSMS API rate limiting: 500 kişiye gönderirken bad request hatası alınıyor
    // Batch size'ı küçültüp rate limiting ekleyerek daha yavaş gönderelim
    const BATCH_SIZE = 50; // Küçük batch'ler (500'den 50'ye düşürüldü)
    const CONCURRENT_LIMIT = 10; // Düşük concurrent limit (rate limiting için)
    const RATE_LIMIT_DELAY = 50; // Her batch arasında 50ms bekle (rate limiting)
    const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;
    const creditPerMessage = requiredCredit; // Mesaj başına kredi
    
    // Telefon numaralarını batch'lere böl
    const batches: string[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
      batches.push(phoneNumbers.slice(i, i + BATCH_SIZE));
    }

    console.log(`[Advanced SMS Send] Toplam ${phoneNumbers.length} numara, ${batches.length} batch halinde işlenecek (Batch size: ${BATCH_SIZE}, Concurrent: ${CONCURRENT_LIMIT})`);

    // Tüm gönderimler için progress tracking
    const jobId = generateJobId();
    createSMSJob(jobId, phoneNumbers.length, batches.length);
    updateProgress(jobId, { status: 'processing' });
    console.log(`[Advanced SMS Send] Progress tracking başlatıldı - Job ID: ${jobId}`);

    // Her batch'i işle
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[Advanced SMS Send] Batch ${batchIndex + 1}/${batches.length} işleniyor (${batch.length} numara)`);
      
      const batchResults: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
      
      // Paralel olarak gönder (rate limiting ile)
      for (let i = 0; i < batch.length; i += CONCURRENT_LIMIT) {
        const concurrentBatch = batch.slice(i, i + CONCURRENT_LIMIT);
        const concurrentPromises = concurrentBatch.map(async (phoneNumber, idx) => {
          const startTime = Date.now();
          
          try {
            // Her SMS arasında küçük bir delay (rate limiting)
            if (idx > 0) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Request log
            await logSendRequest({
              userId: auth.user!.id,
              phoneNumber,
              message: Message,
              endpoint: '/api/v1/sms/send-advanced',
              requestData: { From, Coding, StartDate, ValidityPeriod, batchIndex, concurrentIndex: idx },
              ipAddress,
              userAgent,
            });
            
            const smsResult = await sendSMS(phoneNumber, Message);
            const durationMs = Date.now() - startTime;
            
            // Response log
            await logSendResponse({
              userId: auth.user!.id,
              phoneNumber,
              message: Message,
              status: smsResult.success ? 'gönderildi' : 'failed',
              cepSmsMessageId: smsResult.messageId,
              responseData: smsResult.success ? { messageId: smsResult.messageId } : { error: smsResult.error },
              durationMs,
              success: smsResult.success,
            });
            
            return {
              phone: phoneNumber,
              success: smsResult.success,
              messageId: smsResult.messageId,
              error: smsResult.error,
            };
          } catch (error: any) {
            // Exception error log
            await logSendError({
              userId: auth.user!.id,
              phoneNumber,
              message: Message,
              error: error instanceof Error ? error : new Error(String(error)),
              endpoint: '/api/v1/sms/send-advanced',
            });
            
            console.error(`[Advanced SMS Send] Batch ${batchIndex + 1}: SMS gönderim exception - ${phoneNumber}:`, error);
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
      
      console.log(`[Advanced SMS Send] Batch ${batchIndex + 1}: Tamamlandı - ${batchResults.filter(r => r.success).length} başarılı, ${batchResults.filter(r => !r.success).length} başarısız`);
      
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
      console.log(`[Advanced SMS Send] Progress: ${results.length}/${phoneNumbers.length} (${Math.round((results.length / phoneNumbers.length) * 100)}%)`);

      // Her batch sonrası başarılı gönderimleri bulk insert yap
      const successfulBatchSends = batchResults.filter((r) => r.success && r.messageId);
      if (successfulBatchSends.length > 0 && auth.user) {
        const bulkInsertData = successfulBatchSends.map((result) => ({
          user_id: auth.user!.id,
          phone_number: result.phone,
          message: Message,
          sender: From || null,
          status: 'gönderildi',
          cost: creditPerMessage, // Admin'ler de sistem kredisinden düşüyor
          cep_sms_message_id: result.messageId,
          sent_at: StartDate ? new Date(StartDate).toISOString() : new Date().toISOString(),
        }));
        
        // Bulk insert (her batch için)
        const { data: insertedMessages, error: insertError } = await supabaseServer
          .from('sms_messages')
          .insert(bulkInsertData)
          .select('id');
        
        if (insertError) {
          console.error(`[Advanced SMS Send] Batch ${batchIndex + 1}: SMS kayıtları eklenemedi!`, insertError);
          // Log database error
          for (const result of successfulBatchSends) {
            await logDatabaseOperation({
              operation: 'insert',
              userId: auth.user!.id,
              phoneNumber: result.phone,
              success: false,
              error: insertError.message,
              metadata: { cepSmsMessageId: result.messageId },
            });
          }
        } else {
          console.log(`[Advanced SMS Send] Batch ${batchIndex + 1}: ${successfulBatchSends.length} SMS kaydedildi`);
          // Log successful database operations
          if (insertedMessages) {
            for (let i = 0; i < insertedMessages.length && i < successfulBatchSends.length; i++) {
              await logDatabaseOperation({
                operation: 'insert',
                smsMessageId: insertedMessages[i].id,
                userId: auth.user!.id,
                phoneNumber: successfulBatchSends[i].phone,
                success: true,
                metadata: { cepSmsMessageId: successfulBatchSends[i].messageId },
              });
            }
          }
        }
      }

      // Her batch sonrası başarısız gönderimleri kaydet ve iade oluştur (bulk)
      const failedBatchSends = batchResults.filter((r) => !r.success);
      if (failedBatchSends.length > 0 && !isAdmin && auth.user) {
        // Önce başarısız SMS'leri bulk insert yap
        const bulkFailedData = failedBatchSends.map((result) => ({
          user_id: auth.user!.id,
          phone_number: result.phone,
          message: Message,
          sender: From || null,
          status: 'failed',
          cost: creditPerMessage,
          failed_at: new Date().toISOString(),
        }));
        
        const { data: failedSmsDataArray, error: failedInsertError } = await supabaseServer
          .from('sms_messages')
          .insert(bulkFailedData)
          .select();
        
        if (!failedInsertError && failedSmsDataArray && failedSmsDataArray.length > 0) {
          // Her başarısız SMS için iade oluştur (bulk)
          const bulkRefundData = failedSmsDataArray.map((failedSmsData, index) => {
            const errorDetail = failedBatchSends[index].error || 'Bilinmeyen hata';
            return {
              user_id: auth.user!.id,
              sms_id: failedSmsData.id,
              original_cost: creditPerMessage,
              refund_amount: creditPerMessage,
              reason: `SMS gönderim başarısız - Otomatik iade (48 saat) - Telefon: ${failedBatchSends[index].phone} - Hata: ${errorDetail}`,
              status: 'pending',
            };
          });
          
          await supabaseServer
            .from('refunds')
            .insert(bulkRefundData);
        }
      }
    }

    // Progress'i tamamlandı olarak işaretle
    saveResults(jobId, results);
    updateProgress(jobId, {
      status: successCount === phoneNumbers.length ? 'completed' : (successCount > 0 ? 'completed' : 'failed'),
      completed: results.length,
      successCount,
      failCount,
      currentBatch: batches.length,
    });

    // Sonuç - API v1 formatında döndür
    const successfulSends = results.filter((r) => r.success && r.messageId);
    
    if (successCount === phoneNumbers.length) {
      // Tüm SMS'ler başarılı - ilk mesaj ID'sini döndür
      const firstSuccess = successfulSends[0];
      return NextResponse.json({
        MessageId: firstSuccess?.messageId || 0,
        Status: 'OK',
        TotalSent: successCount,
        TotalFailed: failCount,
        JobId: jobId, // Tüm gönderimlerde job ID gönder
      });
    } else if (successCount > 0) {
      // Kısmen başarılı
      const firstSuccess = successfulSends[0];
      return NextResponse.json({
        MessageId: firstSuccess?.messageId || 0,
        Status: 'Partial',
        TotalSent: successCount,
        TotalFailed: failCount,
        Error: `${failCount} adet SMS gönderilemedi`,
        JobId: jobId, // Büyük gönderimlerde job ID gönder
      });
    } else {
      // Tüm SMS'ler başarısız
      return NextResponse.json(
        {
          MessageId: 0,
          Status: 'Error',
          Error: results[0]?.error || 'SMS gönderim başarısız',
          TotalSent: successCount,
          TotalFailed: failCount,
          JobId: jobId, // Büyük gönderimlerde job ID gönder
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('SMS send advanced error:', error);
    return NextResponse.json(
      {
        MessageId: 0,
        Status: 'Error',
        Error: error.message || 'SMS gönderim hatası',
      },
      { status: 500 }
    );
  }
}

