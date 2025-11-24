import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

/**
 * GET /api/admin/sms-logs - SMS loglarını listele (Admin)
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 1000); // Maksimum 1000 kayıt
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const logType = searchParams.get('logType');
    const logLevel = searchParams.get('logLevel');
    const phoneNumber = searchParams.get('phoneNumber');
    const status = searchParams.get('status');
    const smsMessageId = searchParams.get('smsMessageId');
    const searchQuery = searchParams.get('search'); // Genel arama (mesaj, telefon, hata mesajı)

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Query oluştur
    let query = supabaseServer
      .from('sms_logs')
      .select('*, users(id, username, email), sms_messages(id, phone_number, message, status)', { count: 'exact' });

    // Filtreler
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (logType) {
      query = query.eq('log_type', logType);
    }

    if (logLevel) {
      query = query.eq('log_level', logLevel);
    }

    if (phoneNumber) {
      query = query.ilike('phone_number', `%${phoneNumber}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (smsMessageId) {
      query = query.eq('sms_message_id', smsMessageId);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte('created_at', start.toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    // Genel arama (mesaj, telefon, hata mesajı)
    if (searchQuery) {
      query = query.or(`message.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,error_message.ilike.%${searchQuery}%`);
    }

    // Sıralama ve sayfalama
    const { data: logsData, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    // Format logs data
    const logs = (logsData || []).map((log: any) => ({
      id: log.id,
      smsMessageId: log.sms_message_id,
      userId: log.user_id,
      phoneNumber: log.phone_number,
      message: log.message,
      messagePreview: log.message_preview,
      logType: log.log_type,
      logLevel: log.log_level,
      status: log.status,
      cepSmsMessageId: log.cep_sms_message_id,
      creditAmount: log.credit_amount ? Number(log.credit_amount) : null,
      requestData: log.request_data,
      responseData: log.response_data,
      errorMessage: log.error_message,
      errorStack: log.error_stack,
      durationMs: log.duration_ms,
      endpoint: log.endpoint,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      metadata: log.metadata,
      createdAt: log.created_at,
      user: log.users ? {
        id: log.users.id,
        username: log.users.username,
        email: log.users.email,
      } : null,
      smsMessage: log.sms_messages ? {
        id: log.sms_messages.id,
        phoneNumber: log.sms_messages.phone_number,
        message: log.sms_messages.message,
        status: log.sms_messages.status,
      } : null,
    }));

    const total = count || 0;

    // İstatistikler
    const stats = {
      total,
      byLogType: {} as Record<string, number>,
      byLogLevel: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      errorCount: 0,
      successCount: 0,
    };

    logs.forEach((log: any) => {
      // Log type istatistikleri
      if (stats.byLogType[log.logType]) {
        stats.byLogType[log.logType]++;
      } else {
        stats.byLogType[log.logType] = 1;
      }

      // Log level istatistikleri
      if (stats.byLogLevel[log.logLevel]) {
        stats.byLogLevel[log.logLevel]++;
      } else {
        stats.byLogLevel[log.logLevel] = 1;
      }

      // Status istatistikleri
      if (log.status) {
        if (stats.byStatus[log.status]) {
          stats.byStatus[log.status]++;
        } else {
          stats.byStatus[log.status] = 1;
        }
      }

      // Error ve success sayıları
      if (log.logLevel === 'error') {
        stats.errorCount++;
      } else if (log.logLevel === 'success') {
        stats.successCount++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error: any) {
    console.error('Admin SMS logs error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS logları alınamadı' },
      { status: 500 }
    );
  }
}
