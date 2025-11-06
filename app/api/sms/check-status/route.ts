import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { checkSMSStatus } from '@/lib/utils/cepSMSProvider';

// POST /api/sms/check-status - SMS durumlarını kontrol et ve güncelle
// Bu endpoint cron job veya scheduled task tarafından çağrılacak
export async function POST(request: NextRequest) {
  try {
    // Secret key kontrolü (cron job için) - opsiyonel
    const secretKey = request.headers.get('x-secret-key');
    
    if (process.env.CRON_SECRET_KEY && secretKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 SMS durum kontrolü başlatılıyor...');

    const supabaseServer = getSupabaseServer();

    // 5 dakikadan eski ve hala "sent" durumunda olan mesajları bul
    // (Yeni gönderilen mesajlar için biraz bekleme süresi ver)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: sentMessages, error: messagesError } = await supabaseServer
      .from('sms_messages')
      .select('id, cep_sms_message_id, status, user_id, cost')
      .eq('status', 'sent')
      .lte('sent_at', fiveMinutesAgo.toISOString())
      .not('cep_sms_message_id', 'is', null)
      .limit(100); // Her seferinde maksimum 100 mesaj kontrol et

    if (messagesError) {
      console.error('❌ Mesajları getirme hatası:', messagesError);
      return NextResponse.json(
        {
          success: false,
          error: messagesError.message || 'Mesajları getirme hatası',
        },
        { status: 500 }
      );
    }

    console.log(`📊 ${sentMessages?.length || 0} mesaj kontrol edilecek`);

    let checkedCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    let errorCount = 0;

    for (const message of sentMessages || []) {
      try {
        if (!message.cep_sms_message_id) {
          continue;
        }

        // CepSMS API'den mesaj durumunu kontrol et
        const statusResult = await checkSMSStatus(message.cep_sms_message_id);

        if (!statusResult.success) {
          console.warn(`⚠️ Mesaj durumu kontrol edilemedi (${message.id}):`, statusResult.error);
          errorCount++;
          continue;
        }

        const newStatus = statusResult.status;

        // Durum değişikliği varsa güncelle
        if (newStatus && newStatus !== 'sent' && newStatus !== 'pending') {
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          };

          if (newStatus === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
          } else if (newStatus === 'failed') {
            updateData.failed_at = new Date().toISOString();

            // Başarısız mesaj için otomatik iade oluştur (eğer daha önce oluşturulmamışsa)
            const { data: existingRefund } = await supabaseServer
              .from('refunds')
              .select('id')
              .eq('sms_id', message.id)
              .eq('status', 'pending')
              .single();

            if (!existingRefund) {
              await supabaseServer
                .from('refunds')
                .insert({
                  user_id: message.user_id,
                  sms_id: message.id,
                  original_cost: Number(message.cost) || 1,
                  refund_amount: Number(message.cost) || 1,
                  reason: 'SMS iletilmedi - Otomatik iade (48 saat)',
                  status: 'pending',
                });
            }
          }

          // Mesaj durumunu güncelle
          const { error: updateError } = await supabaseServer
            .from('sms_messages')
            .update(updateData)
            .eq('id', message.id);

          if (updateError) {
            console.error(`❌ Mesaj durumu güncellenemedi (${message.id}):`, updateError);
            errorCount++;
          } else {
            checkedCount++;
            if (newStatus === 'delivered') {
              deliveredCount++;
            } else if (newStatus === 'failed') {
              failedCount++;
            }
            console.log(`✅ Mesaj durumu güncellendi (${message.id}): ${newStatus}`);
          }
        } else {
          // Durum hala "sent" veya "pending" ise, bir sonraki kontrol için beklet
          checkedCount++;
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Mesaj durumu kontrol hatası (${message.id}):`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `SMS durum kontrolü tamamlandı`,
      data: {
        checked: checkedCount,
        delivered: deliveredCount,
        failed: failedCount,
        errors: errorCount,
        total: sentMessages?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('❌ SMS durum kontrolü hatası:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'SMS durum kontrolü hatası',
      },
      { status: 500 }
    );
  }
}

