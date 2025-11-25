import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// GET /api/admin/sms-history - SMS geçmişi
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 10000); // Maksimum 10000 kayıt
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const phoneNumber = searchParams.get('phoneNumber');
    const messageSearch = searchParams.get('messageSearch');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get SMS messages and total count using Supabase
    let query = supabaseServer
      .from('sms_messages')
      .select('*, users!sms_messages_user_id_fkey(id, username, email), contacts!sms_messages_contact_id_fkey(id, name, phone)', { count: 'exact' });

    // User filtering
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Date filtering
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

    // Status filtering - support both English and Turkish status values
    if (status) {
      const statusMap: Record<string, string[]> = {
        'sent': ['sent', 'gönderildi', 'rapor_bekliyor'],
        'delivered': ['delivered', 'iletildi'],
        'failed': ['failed', 'iletilmedi', 'zaman_aşımı', 'timeout'],
      };
      
      const mappedStatuses = statusMap[status.toLowerCase()] || [status];
      if (mappedStatuses.length === 1) {
        query = query.eq('status', mappedStatuses[0]);
      } else {
        query = query.in('status', mappedStatuses);
      }
    }
    
    // Phone number filtering
    if (phoneNumber) {
      query = query.ilike('phone_number', `%${phoneNumber}%`);
    }
    
    // Message search filtering
    if (messageSearch) {
      query = query.ilike('message', `%${messageSearch}%`);
    }

    const { data: messagesData, count, error } = await query
      .order('sent_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    // Format messages data
    const messages = (messagesData || []).map((msg: any) => ({
      id: msg.id,
      userId: msg.user_id,
      contactId: msg.contact_id,
      phoneNumber: msg.phone_number,
      message: msg.message,
      sender: msg.sender,
      status: msg.status,
      cost: msg.cost,
      cepSmsMessageId: msg.cep_sms_message_id,
      sentAt: msg.sent_at,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      user: msg.users ? {
        id: msg.users.id,
        username: msg.users.username,
        email: msg.users.email,
      } : null,
      contact: msg.contacts ? {
        id: msg.contacts.id,
        name: msg.contacts.name,
        phone: msg.contacts.phone,
      } : null,
    }));

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Admin SMS history error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS geçmişi hatası' },
      { status: 500 }
    );
  }
}

