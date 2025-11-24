import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';
import { checkSMSStatus } from '@/lib/utils/cepSMSProvider';

/**
 * GET /api/admin/sms-verification - SMS gönderimlerinin doğrulaması ve istatistikleri
 * Bu endpoint, SMS'lerin gerçekten gidip gitmediğini ve durumlarını kontrol eder
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!requireAdmin(auth.user)) {
      return NextResponse.json(
        { success: false, message: 'Admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const verifyNow = searchParams.get('verifyNow') === 'true'; // Anlık doğrulama isteniyor mu?

    // Query oluştur
    let query = supabaseServer
      .from('sms_messages')
      .select('id, user_id, phone_number, message, status, cep_sms_message_id, cost, sent_at, network, delivered_at, failed_at, users(id, username, email)');

    // Filtreler
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte('sent_at', start.toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('sent_at', end.toISOString());
    }

    // Son 24 saat içindeki gönderimler (varsayılan)
    if (!startDate && !endDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      query = query.gte('sent_at', yesterday.toISOString());
    }

    const { data: messages, error: messagesError } = await query
      .order('sent_at', { ascending: false })
      .limit(10000); // Maksimum 10,000 kayıt

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    // İstatistikleri hesapla
    const total = messages?.length || 0;
    const withMessageId = messages?.filter(m => m.cep_sms_message_id && m.cep_sms_message_id !== '0' && m.cep_sms_message_id !== 'null').length || 0;
    const withoutMessageId = total - withMessageId;
    
    // Durum bazlı sayılar
    const statusCounts = {
      'gönderildi': 0,
      'rapor_bekliyor': 0,
      'iletildi': 0,
      'iletilmedi': 0,
      'zaman_aşımı': 0,
      'failed': 0,
      'sent': 0,
      'delivered': 0,
    };

    messages?.forEach(msg => {
      const status = (msg.status || 'gönderildi').toLowerCase();
      if (statusCounts[status as keyof typeof statusCounts] !== undefined) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });

    const delivered = (statusCounts['iletildi'] || 0) + (statusCounts['delivered'] || 0);
    const failed = (statusCounts['iletilmedi'] || 0) + (statusCounts['zaman_aşımı'] || 0) + (statusCounts['failed'] || 0);
    const pending = (statusCounts['gönderildi'] || 0) + (statusCounts['rapor_bekliyor'] || 0) + (statusCounts['sent'] || 0);

    // Anlık doğrulama isteniyorsa, örnek birkaç mesajı kontrol et
    let verificationResults: any[] = [];
    if (verifyNow && withMessageId > 0) {
      // MessageId'si olan ilk 10 mesajı kontrol et (örnek)
      const samplesToCheck = messages
        ?.filter(m => m.cep_sms_message_id && m.cep_sms_message_id !== '0' && m.cep_sms_message_id !== 'null')
        .slice(0, 10) || [];

      console.log(`[SMS Verification] ${samplesToCheck.length} örnek mesaj kontrol ediliyor...`);

      for (const message of samplesToCheck) {
        try {
          const statusResult = await checkSMSStatus(message.cep_sms_message_id!, message.phone_number);
          verificationResults.push({
            messageId: message.id,
            cepSmsMessageId: message.cep_sms_message_id,
            phoneNumber: message.phone_number,
            currentStatus: message.status,
            verifiedStatus: statusResult.status || 'rapor_bekliyor',
            verifiedNetwork: statusResult.network || null,
            success: statusResult.success,
            error: statusResult.error || null,
          });

          // Her kontrol arasında küçük bir bekleme (rate limiting)
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          verificationResults.push({
            messageId: message.id,
            cepSmsMessageId: message.cep_sms_message_id,
            phoneNumber: message.phone_number,
            currentStatus: message.status,
            verifiedStatus: null,
            verifiedNetwork: null,
            success: false,
            error: error.message || 'Doğrulama hatası',
          });
        }
      }
    }

    // Grup bazlı istatistikler (mesaj içeriğine göre)
    const messageGroups = new Map<string, {
      message: string;
      total: number;
      withMessageId: number;
      delivered: number;
      failed: number;
      pending: number;
    }>();

    messages?.forEach(msg => {
      const messageKey = msg.message?.substring(0, 50) || 'Boş mesaj';
      if (!messageGroups.has(messageKey)) {
        messageGroups.set(messageKey, {
          message: messageKey,
          total: 0,
          withMessageId: 0,
          delivered: 0,
          failed: 0,
          pending: 0,
        });
      }

      const group = messageGroups.get(messageKey)!;
      group.total++;
      
      if (msg.cep_sms_message_id && msg.cep_sms_message_id !== '0' && msg.cep_sms_message_id !== 'null') {
        group.withMessageId++;
      }

      const status = (msg.status || 'gönderildi').toLowerCase();
      if (status === 'iletildi' || status === 'delivered') {
        group.delivered++;
      } else if (status === 'iletilmedi' || status === 'zaman_aşımı' || status === 'failed') {
        group.failed++;
      } else {
        group.pending++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total,
          withMessageId, // CepSMS'e ulaşan (MessageId'si olan)
          withoutMessageId, // CepSMS'e ulaşmayan (MessageId yok)
          delivered,
          failed,
          pending,
          deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) + '%' : '0%',
          cepSmsAcceptanceRate: total > 0 ? ((withMessageId / total) * 100).toFixed(2) + '%' : '0%',
        },
        statusCounts,
        messageGroups: Array.from(messageGroups.values()).slice(0, 10), // İlk 10 grup
        verificationResults: verifyNow ? verificationResults : [],
        sampleMessages: messages?.slice(0, 50).map(m => ({
          id: m.id,
          phoneNumber: m.phone_number,
          status: m.status,
          cepSmsMessageId: m.cep_sms_message_id,
          hasMessageId: !!(m.cep_sms_message_id && m.cep_sms_message_id !== '0' && m.cep_sms_message_id !== 'null'),
          sentAt: m.sent_at,
          network: m.network,
          deliveredAt: m.delivered_at,
          failedAt: m.failed_at,
          user: m.users && !Array.isArray(m.users) ? {
            id: (m.users as any).id,
            username: (m.users as any).username,
          } : null,
        })),
      },
    });
  } catch (error: any) {
    console.error('SMS verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS doğrulama hatası' },
      { status: 500 }
    );
  }
}
