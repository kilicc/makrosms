import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// GET /api/admin/payment-history - Ödeme geçmişi
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const skip = (page - 1) * limit;

    // Get payments and total count
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.payment.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Admin payment history error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Ödeme geçmişi hatası' },
      { status: 500 }
    );
  }
}

