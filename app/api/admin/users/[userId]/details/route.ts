import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// GET /api/admin/users/:userId/details - Kullanıcı detayları (aktivite, SMS, ödeme talepleri)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;

    // Get user info
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, username, email, credit, role, created_at, last_login, visible_to_admin_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Gizli kullanıcı kontrolü: Eğer kullanıcının visible_to_admin_id'si varsa ve mevcut admin'in ID'si ile eşleşmiyorsa, erişim reddedilir
    if (userData.visible_to_admin_id && userData.visible_to_admin_id !== auth.user.userId) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Get recent SMS messages (last 20)
    const { data: smsData, error: smsError } = await supabaseServer
      .from('sms_messages')
      .select('id, phone_number, message, status, sent_at, cost, contacts(id, name, phone)')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (smsError) {
      console.error('SMS fetch error:', smsError);
    }

    // Get payment requests (last 20)
    const { data: paymentRequestsData, error: paymentRequestsError } = await supabaseServer
      .from('payment_requests')
      .select('id, amount, currency, credits, payment_method, status, transaction_id, created_at, admin_notes, rejection_reason')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (paymentRequestsError) {
      console.error('Payment requests fetch error:', paymentRequestsError);
    }

    // Format data
    const user = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      credit: userData.credit || 0,
      role: userData.role || 'user',
      createdAt: userData.created_at,
      lastLogin: userData.last_login,
    };

    const smsMessages = (smsData || []).map((msg: any) => ({
      id: msg.id,
      phoneNumber: msg.phone_number,
      message: msg.message,
      status: msg.status,
      cost: msg.cost,
      sentAt: msg.sent_at,
      contact: msg.contacts ? {
        id: msg.contacts.id,
        name: msg.contacts.name,
        phone: msg.contacts.phone,
      } : null,
    }));

    const paymentRequests = (paymentRequestsData || []).map((req: any) => ({
      id: req.id,
      amount: req.amount,
      currency: req.currency,
      credits: req.credits,
      paymentMethod: req.payment_method,
      status: req.status,
      transactionId: req.transaction_id,
      createdAt: req.created_at,
      adminNotes: req.admin_notes,
      rejectionReason: req.rejection_reason,
    }));

    // Get total stats
    const { count: totalSMS } = await supabaseServer
      .from('sms_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: totalPaymentRequests } = await supabaseServer
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      data: {
        user,
        smsMessages,
        paymentRequests,
        stats: {
          totalSMS: totalSMS || 0,
          totalPaymentRequests: totalPaymentRequests || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('User details error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kullanıcı detayları hatası' },
      { status: 500 }
    );
  }
}

