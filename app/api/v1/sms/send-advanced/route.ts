import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { authenticateApiKey } from '@/lib/middleware/apiKeyAuth';
import { sendSMS, formatPhoneNumber } from '@/lib/utils/cepSMSProvider';

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

    if (!isAdmin) {
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
      const messageLength = Message.length;
      requiredCredit = Math.ceil(messageLength / 180) || 1;
      const totalRequiredCredit = phoneNumbers.length * requiredCredit;

      if (userCredit < totalRequiredCredit) {
        return NextResponse.json(
          {
            MessageId: 0,
            Status: 'Error',
            Error: `Yetersiz kredi. Gerekli: ${totalRequiredCredit}, Mevcut: ${userCredit}`,
          },
          { status: 400 }
        );
      }

      // Kredi düş
      await supabaseServer
        .from('users')
        .update({ credit: Math.max(0, userCredit - totalRequiredCredit) })
        .eq('id', auth.user.id);
    } else {
      const messageLength = Message.length;
      requiredCredit = Math.ceil(messageLength / 180) || 1;
    }

    // Her numaraya ayrı SMS gönder
    const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;
    const creditPerMessage = requiredCredit; // Mesaj başına kredi
    
    for (const phoneNumber of phoneNumbers) {
      const smsResult = await sendSMS(phoneNumber, Message);
      results.push({
        phone: phoneNumber,
        success: smsResult.success,
        messageId: smsResult.messageId,
        error: smsResult.error,
      });
      
      if (smsResult.success && smsResult.messageId) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Başarılı gönderimleri kaydet
    const successfulSends = results.filter((r) => r.success && r.messageId);
    if (successfulSends.length > 0) {
      for (const result of successfulSends) {
        await supabaseServer
          .from('sms_messages')
          .insert({
            user_id: auth.user.id,
            phone_number: result.phone,
            message: Message,
            sender: From || null,
            status: 'gönderildi',
            cost: isAdmin ? 0 : creditPerMessage,
            cep_sms_message_id: result.messageId,
            sent_at: StartDate ? new Date(StartDate).toISOString() : new Date().toISOString(),
          });
      }
    }

    // Başarısız gönderimleri kaydet ve iade oluştur
    const failedSends = results.filter((r) => !r.success);
    if (failedSends.length > 0 && !isAdmin) {
      for (const result of failedSends) {
        const { data: failedSmsData } = await supabaseServer
          .from('sms_messages')
          .insert({
            user_id: auth.user.id,
            phone_number: result.phone,
            message: Message,
            sender: From || null,
            status: 'failed',
            cost: creditPerMessage,
            failed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (failedSmsData) {
          // Otomatik iade oluştur (48 saat sonra işlenecek)
          await supabaseServer
            .from('refunds')
            .insert({
              user_id: auth.user.id,
              sms_id: failedSmsData.id,
              original_cost: creditPerMessage,
              refund_amount: creditPerMessage,
              reason: `SMS gönderim başarısız - Otomatik iade (48 saat) - ${result.error || 'Bilinmeyen hata'}`,
              status: 'pending',
            });
        }
      }
    }

    // Sonuç - API v1 formatında döndür
    if (successCount === phoneNumbers.length) {
      // Tüm SMS'ler başarılı - ilk mesaj ID'sini döndür
      const firstSuccess = successfulSends[0];
      return NextResponse.json({
        MessageId: firstSuccess?.messageId || 0,
        Status: 'OK',
        TotalSent: successCount,
        TotalFailed: failCount,
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

