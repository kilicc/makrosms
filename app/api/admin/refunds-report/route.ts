import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// GET /api/admin/refunds-report - İade raporu (kullanıcı bazlı günlük SMS ve iadeler)
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Tüm kullanıcıları al
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    // Her kullanıcı için günlük SMS sayısı ve iade bilgilerini al
    const userReports = await Promise.all(
      users.map(async (user) => {
        // Bugünkü SMS sayısı
        const todaySMS = await prisma.smsMessage.count({
          where: {
            userId: user.id,
            sentAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        // Bugünkü başarısız SMS sayısı
        const todayFailedSMS = await prisma.smsMessage.count({
          where: {
            userId: user.id,
            status: 'failed',
            sentAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        // Bugünkü iadeler
        const todayRefunds = await prisma.refund.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            sms: {
              select: {
                id: true,
                phoneNumber: true,
                message: true,
                sentAt: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Toplam iade tutarı
        const totalRefundAmount = todayRefunds.reduce(
          (sum, refund) => sum + Number(refund.refundAmount),
          0
        );

        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
          todaySMS,
          todayFailedSMS,
          todayRefunds: todayRefunds.length,
          totalRefundAmount,
          refunds: todayRefunds.map((refund) => ({
            id: refund.id,
            sms: {
              id: refund.sms?.id || '',
              phoneNumber: refund.sms?.phoneNumber || '',
              message: refund.sms?.message || '',
              sentAt: refund.sms?.sentAt || null,
              status: refund.sms?.status || '',
            },
            originalCost: Number(refund.originalCost),
            refundAmount: Number(refund.refundAmount),
            reason: refund.reason,
            status: refund.status,
            createdAt: refund.createdAt,
          })),
        };
      })
    );

    // Sadece SMS gönderen veya iadesi olan kullanıcıları filtrele
    const filteredReports = userReports.filter(
      (report) => report.todaySMS > 0 || report.todayRefunds > 0
    );

    return NextResponse.json({
      success: true,
      data: {
        date,
        reports: filteredReports,
        summary: {
          totalUsers: filteredReports.length,
          totalSMS: filteredReports.reduce((sum, r) => sum + r.todaySMS, 0),
          totalFailedSMS: filteredReports.reduce((sum, r) => sum + r.todayFailedSMS, 0),
          totalRefunds: filteredReports.reduce((sum, r) => sum + r.todayRefunds, 0),
          totalRefundAmount: filteredReports.reduce((sum, r) => sum + r.totalRefundAmount, 0),
        },
      },
    });
  } catch (error: any) {
    console.error('Admin refunds report error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İade raporu hatası' },
      { status: 500 }
    );
  }
}

