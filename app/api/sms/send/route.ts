import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { sendSMS } from '@/lib/utils/cepSMSProvider';

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

    // Telefon numarası validasyonu: Sadece 905**, 05**, 5** formatları kabul edilir
    const phoneNumbers = phone.split(/[,\n]/).map((p: string) => p.trim()).filter((p: string) => p);
    const phoneRegex = /^(905|05|5)\d+$/;
    const invalidPhones = phoneNumbers.filter((p: string) => !phoneRegex.test(p));
    
    if (invalidPhones.length > 0) {
      return NextResponse.json(
        { success: false, message: `Geçersiz telefon numarası formatı: ${invalidPhones.join(', ')}. Sadece 905**, 05**, 5** formatları kabul edilir.` },
        { status: 400 }
      );
    }

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

    // Her numaraya ayrı SMS gönder
    const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const phoneNumber of phoneNumbers) {
      const smsResult = await sendSMS(phoneNumber, message);
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
            user_id: auth.user.userId,
            phone_number: result.phone,
            message,
            sender: serviceName || null,
            status: 'gönderildi',
            cost: isAdmin ? 0 : creditPerMessage, // Her mesaj için kredi
            cep_sms_message_id: result.messageId,
            sent_at: new Date().toISOString(),
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
            user_id: auth.user.userId,
            phone_number: result.phone,
            message,
            sender: serviceName || null,
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
              user_id: auth.user.userId,
              sms_id: failedSmsData.id,
              original_cost: creditPerMessage,
              refund_amount: creditPerMessage,
              reason: `SMS gönderim başarısız - Otomatik iade (48 saat) - ${result.error || 'Bilinmeyen hata'}`,
              status: 'pending',
            });
        }
      }
    }

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

