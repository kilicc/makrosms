import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/payment/crypto-status/:paymentId - Ödeme durumu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentId } = await params;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: auth.user.userId,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Ödeme bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { payment },
    });
  } catch (error: any) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Ödeme durumu hatası' },
      { status: 500 }
    );
  }
}

