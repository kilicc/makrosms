import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { sendSMS, formatPhoneNumber } from '@/lib/utils/cepSMSProvider';
import { createSMSJob, updateProgress, generateJobId, saveResults } from '@/lib/utils/smsProgress';
import { getSystemCredit, deductFromSystemCredit, checkSystemCredit } from '@/lib/utils/systemCredit';

// Büyük gönderimler için timeout'u arttır (600 saniye = 10 dakika)
// CepSMS API: 50,000 SMS / 10 dakika = ~83 SMS/saniye
export const maxDuration = 600;
export const dynamic = 'force-dynamic';

// POST /api/bulk-sms/send-bulk - Toplu SMS gönderimi
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
    const { contactIds, message, templateId, sender } = body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kişi listesi gerekli' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mesaj içeriği gerekli' },
        { status: 400 }
      );
    }

    // Remove duplicate contact IDs (eğer aynı kişi hem grup hem manuel seçilmişse)
    const uniqueContactIds = [...new Set(contactIds)];

    // Admin kullanıcıları için rol kontrolü
    const userRole = (auth.user.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'moderator' || userRole === 'administrator';

    // Kredi hesaplama için değişkenler
    let requiredCredit = 0;
    let creditPerMessage = 0;

    // Get contacts using Supabase
    const { data: contactsData, error: contactsError } = await supabaseServer
      .from('contacts')
      .select('id, phone')
      .in('id', uniqueContactIds)
      .eq('user_id', auth.user.userId)
      .eq('is_active', true)
      .eq('is_blocked', false);

    if (contactsError) {
      return NextResponse.json(
        { success: false, message: contactsError.message || 'Kişiler alınamadı' },
        { status: 500 }
      );
    }

    const contacts = contactsData || [];

    if (contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli kişi bulunamadı' },
        { status: 400 }
      );
    }

    // Kredi hesaplama: 180 karakter = 1 kredi
    // Her numara için mesaj uzunluğuna göre kredi hesaplanır
    const messageLength = message.length;
    creditPerMessage = Math.ceil(messageLength / 180) || 1; // En az 1 kredi
    requiredCredit = contacts.length * creditPerMessage; // Her numara için kredi
    
    // Normal kullanıcılar ve adminler için sistem kredisinden kontrol ve düş
    // Sistem kredisini kontrol et (admin kredisi)
    const systemCreditAvailable = await checkSystemCredit(requiredCredit);
    
    if (!systemCreditAvailable) {
      const currentSystemCredit = await getSystemCredit();
      return NextResponse.json(
        {
          success: false,
          message: `Yetersiz sistem kredisi. Gerekli: ${requiredCredit} (${contacts.length} numara × ${creditPerMessage} kredi = ${requiredCredit} kredi), Mevcut Sistem Kredisi: ${currentSystemCredit}`,
        },
        { status: 400 }
      );
    }

    // Sistem kredisinden düş (başarılı veya başarısız olsun, tüm SMS'ler için kredi düşülecek, başarısız olursa 48 saat sonra iade edilecek)
    console.log(`[Bulk SMS Send] Sistem kredisinden ${requiredCredit} kredi düşülüyor...`);
    const currentCreditBefore = await getSystemCredit();
    console.log(`[Bulk SMS Send] Mevcut sistem kredisi: ${currentCreditBefore}`);
    
    const deducted = await deductFromSystemCredit(requiredCredit);
    
    if (!deducted) {
      console.error(`[Bulk SMS Send] Sistem kredisi düşülemedi!`);
      return NextResponse.json(
        {
          success: false,
          message: 'Sistem kredisi güncellenemedi',
        },
        { status: 500 }
      );
    }
    
    const currentCreditAfter = await getSystemCredit();
    console.log(`[Bulk SMS Send] Sistem kredisi düşürüldü: ${currentCreditBefore} -> ${currentCreditAfter} (${requiredCredit} kredi düşüldü)`);

    // CepSMS API rate limiting: 500 kişiye gönderirken bad request hatası alınıyor
    // Batch size'ı küçültüp rate limiting ekleyerek daha yavaş gönderelim
    const BATCH_SIZE = 50; // Küçük batch'ler (500'den 50'ye düşürüldü)
    const CONCURRENT_LIMIT = 10; // Düşük concurrent limit (rate limiting için)
    const RATE_LIMIT_DELAY = 50; // Her batch arasında 50ms bekle (rate limiting)
    const batches: Array<typeof contacts> = [];
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      batches.push(contacts.slice(i, i + BATCH_SIZE));
    }

    console.log(`[Bulk SMS Send] Toplam ${contacts.length} kişi, ${batches.length} batch halinde işlenecek (Batch size: ${BATCH_SIZE}, Concurrent: ${CONCURRENT_LIMIT})`);

    // Tüm gönderimler için progress tracking
    const jobId = generateJobId();
    createSMSJob(jobId, contacts.length, batches.length);
    updateProgress(jobId, { status: 'processing' });
    console.log(`[Bulk SMS Send] Progress tracking başlatıldı - Job ID: ${jobId}`);

    const results = {
      sent: 0,
      failed: 0,
      totalCost: 0,
      messageIds: [] as string[],
      errors: [] as string[],
    };

    // Her batch'i işle
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[Bulk SMS Send] Batch ${batchIndex + 1}/${batches.length} işleniyor (${batch.length} kişi)`);
      
      // Paralel olarak gönder (rate limiting ile)
      for (let i = 0; i < batch.length; i += CONCURRENT_LIMIT) {
        const concurrentBatch = batch.slice(i, i + CONCURRENT_LIMIT);
        const concurrentPromises = concurrentBatch.map(async (contact, idx) => {
          try {
            // Her SMS arasında küçük bir delay (rate limiting)
            if (idx > 0) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Her numara için SMS gönder
            const smsResult = await sendSMS(contact.phone, message);

            if (smsResult.success && smsResult.messageId) {
              // Create SMS message record using Supabase
              // Her SMS kaydı = 1 kredi (cost: 1)
              const { data: smsMessageData, error: createError } = await supabaseServer
                .from('sms_messages')
                .insert({
                  user_id: auth.user!.userId,
                  contact_id: contact.id,
                  phone_number: contact.phone,
                  message,
                  sender: sender || null,
                  status: 'gönderildi',
                  cost: isAdmin ? 0 : creditPerMessage, // Admin kullanıcıları için cost: 0
                  cep_sms_message_id: smsResult.messageId,
                  sent_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (!createError && smsMessageData) {
                // Update contact last contacted using Supabase
                const { data: contactData } = await supabaseServer
                  .from('contacts')
                  .select('contact_count')
                  .eq('id', contact.id)
                  .single();

                if (contactData) {
                  await supabaseServer
                    .from('contacts')
                    .update({
                      last_contacted: new Date().toISOString(),
                      contact_count: (contactData.contact_count || 0) + 1,
                    })
                    .eq('id', contact.id);
                }

                return { success: true, contact, smsMessageData };
              } else {
                // SMS kaydı oluşturulamadı ama kredi düşüldü, otomatik iade oluştur
                const { data: failedSmsData, error: failedError } = await supabaseServer
                  .from('sms_messages')
                  .insert({
                    user_id: auth.user!.userId,
                    contact_id: contact.id,
                    phone_number: contact.phone,
                    message,
                    sender: sender || null,
                    status: 'failed',
                    cost: isAdmin ? 0 : creditPerMessage,
                    failed_at: new Date().toISOString(),
                  })
                  .select()
                  .single();

                if (!failedError && failedSmsData && !isAdmin) {
                  await supabaseServer
                    .from('refunds')
                    .insert({
                      user_id: auth.user!.userId,
                      sms_id: failedSmsData.id,
                      original_cost: creditPerMessage,
                      refund_amount: creditPerMessage,
                      reason: 'SMS kaydı oluşturulamadı - Otomatik iade (48 saat)',
                      status: 'pending',
                    });
                }

                return { success: false, contact, error: 'SMS kaydı oluşturulamadı' };
              }
            } else {
              // SMS gönderim başarısız - kredi düşüldü, otomatik iade oluştur (48 saat sonra iade edilecek)
              const { data: failedSmsData, error: failedError } = await supabaseServer
                .from('sms_messages')
                .insert({
                  user_id: auth.user!.userId,
                  contact_id: contact.id,
                  phone_number: contact.phone,
                  message,
                  sender: sender || null,
                  status: 'failed',
                  cost: isAdmin ? 0 : creditPerMessage,
                  failed_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (!failedError && failedSmsData && !isAdmin) {
                await supabaseServer
                  .from('refunds')
                  .insert({
                    user_id: auth.user!.userId,
                    sms_id: failedSmsData.id,
                    original_cost: creditPerMessage,
                    refund_amount: creditPerMessage,
                    reason: 'SMS gönderim başarısız - Otomatik iade (48 saat)',
                    status: 'pending',
                  });
              }

              return { success: false, contact, error: smsResult.error || 'Bilinmeyen hata' };
            }
          } catch (error: any) {
            return { success: false, contact, error: error.message };
          }
        });

        const batchResults = await Promise.all(concurrentPromises);
        
        // Rate limiting: Her concurrent batch sonrası bekleme
        if (i + CONCURRENT_LIMIT < batch.length) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }

        // Sonuçları topla
        for (const result of batchResults) {
          if (result.success) {
            results.sent++;
            results.totalCost += creditPerMessage;
            if (result.smsMessageData?.id) {
              results.messageIds.push(result.smsMessageData.id);
            }
          } else {
            results.failed++;
            results.errors.push(`${result.contact.phone}: ${result.error}`);
          }
        }

        // Rate limiting: Her concurrent batch sonrası bekleme (zaten yukarıda eklendi)
      }

      // Her batch sonrası daha uzun bir bekleme (CepSMS rate limit'i için)
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Progress güncelle
      const completed = results.sent + results.failed;
      updateProgress(jobId, {
        completed,
        successCount: results.sent,
        failCount: results.failed,
        currentBatch: batchIndex + 1,
      });
      console.log(`[Bulk SMS Send] Progress: ${completed}/${contacts.length} (${Math.round((completed / contacts.length) * 100)}%)`);
    }

    // Progress'i tamamlandı olarak işaretle
    const allResults = contacts.map((contact, index) => {
      const result = results.messageIds.length > index 
        ? { phone: contact.phone, success: true }
        : { phone: contact.phone, success: false, error: results.errors[index - results.messageIds.length] || 'Bilinmeyen hata' };
      return result;
    });
    saveResults(jobId, allResults);
    updateProgress(jobId, {
      status: results.sent === contacts.length ? 'completed' : (results.sent > 0 ? 'completed' : 'failed'),
      completed: results.sent + results.failed,
      successCount: results.sent,
      failCount: results.failed,
      currentBatch: batches.length,
    });

    console.log(`[Bulk SMS Send] Tamamlandı: ${results.sent} başarılı, ${results.failed} başarısız`);

    // Sistem kredisini al (gösterim için)
    const currentSystemCredit = await getSystemCredit();

    return NextResponse.json({
      success: true,
      message: `Toplu SMS gönderimi tamamlandı: ${results.sent} başarılı, ${results.failed} başarısız`,
      data: {
        ...results,
        remainingCredit: currentSystemCredit, // Sistem kredisi (admin kredisi)
        jobId, // Tüm gönderimlerde job ID gönder
      },
    });
  } catch (error: any) {
    console.error('Bulk SMS error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS gönderim hatası' },
      { status: 500 }
    );
  }
}

