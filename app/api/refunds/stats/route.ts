import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/refunds/stats - İade istatistikleri
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [totalRefunds, pendingRefunds, approvedRefunds, totalRefundAmount] =
      await Promise.all([
        prisma.refund.count({
          where: { userId: auth.user.userId },
        }),
        prisma.refund.count({
          where: {
            userId: auth.user.userId,
            status: 'pending',
          },
        }),
        prisma.refund.count({
          where: {
            userId: auth.user.userId,
            status: 'approved',
          },
        }),
        prisma.refund.aggregate({
          where: {
            userId: auth.user.userId,
            status: 'processed',
          },
          _sum: {
            refundAmount: true,
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRefunds,
        pendingRefunds,
        approvedRefunds,
        totalRefundAmount: Number(totalRefundAmount._sum.refundAmount || 0),
      },
    });
  } catch (error: any) {
    console.error('Refund stats error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İstatistik hatası' },
      { status: 500 }
    );
  }
}

