import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// GET /api/admin/payment-requests - Tüm ödeme taleplerini listele (Admin)
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
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMethod = searchParams.get('paymentMethod');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const transactionId = searchParams.get('transactionId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build Supabase query - Use separate aliases for users relations to avoid duplicate table name error
    let query = supabaseServer
      .from('payment_requests')
      .select('*, user:users!payment_requests_user_id_fkey(id, username, email), approver:users!payment_requests_approved_by_fkey(id, username, email)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Date filtering
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
    
    // Payment method filtering
    if (paymentMethod) {
      query = query.ilike('payment_method', `%${paymentMethod}%`);
    }
    
    // Amount filtering
    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }
    
    // Transaction ID filtering
    if (transactionId) {
      query = query.ilike('transaction_id', `%${transactionId}%`);
    }

    const { data: requestsData, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    // Format requests data (Supabase returns nested relations with aliases)
    const requests = (requestsData || []).map((req: any) => ({
      id: req.id,
      userId: req.user_id,
      amount: req.amount,
      currency: req.currency || 'TRY',
      paymentMethod: req.payment_method,
      credits: req.credits,
      bonus: req.bonus || 0,
      description: req.description,
      transactionId: req.transaction_id,
      status: req.status || 'pending',
      adminNotes: req.admin_notes,
      approvedBy: req.approved_by,
      approvedAt: req.approved_at,
      rejectedAt: req.rejected_at,
      rejectionReason: req.rejection_reason,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      user: req.user || null,
      approver: req.approver || null,
    }));

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Admin payment requests load error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Ödeme talepleri yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

