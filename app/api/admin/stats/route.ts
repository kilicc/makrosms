import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// GET /api/admin/stats - Sistem istatistikleri
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

    // Get system statistics
    const [
      totalUsers,
      totalContacts,
      totalSMS,
      totalPayments,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.contact.count(),
      prisma.smsMessage.count(),
      prisma.payment.count({
        where: { status: 'completed' },
      }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalContacts,
        totalSMS,
        totalPayments,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İstatistik hatası' },
      { status: 500 }
    );
  }
}

