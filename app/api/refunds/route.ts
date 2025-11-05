import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/refunds - İade geçmişi
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const refunds = await prisma.refund.findMany({
      where: {
        userId: auth.user.userId,
      },
      include: {
        sms: {
          select: {
            id: true,
            phoneNumber: true,
            message: true,
            sentAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: { refunds },
    });
  } catch (error: any) {
    console.error('Refunds GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İade geçmişi hatası' },
      { status: 500 }
    );
  }
}

// POST /api/refunds/process - İade işleme
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { smsId, reason } = body;

    if (!smsId || !reason) {
      return NextResponse.json(
        { success: false, message: 'SMS ID ve sebep gerekli' },
        { status: 400 }
      );
    }

    // Check if SMS exists and belongs to user
    const sms = await prisma.smsMessage.findFirst({
      where: {
        id: smsId,
        userId: auth.user.userId,
        status: 'failed',
        refundProcessed: false,
      },
    });

    if (!sms) {
      return NextResponse.json(
        { success: false, message: 'İade için uygun SMS bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate refund amount (full cost)
    const refundAmount = Number(sms.cost);

    // Create refund request
    const refund = await prisma.refund.create({
      data: {
        userId: auth.user.userId,
        smsId,
        originalCost: refundAmount,
        refundAmount,
        reason,
        status: 'pending',
      },
    });

    // Mark SMS as refund processed
    await prisma.smsMessage.update({
      where: { id: smsId },
      data: { refundProcessed: true },
    });

    return NextResponse.json({
      success: true,
      message: 'İade talebi oluşturuldu',
      data: { refund },
    });
  } catch (error: any) {
    console.error('Refund POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İade işleme hatası' },
      { status: 500 }
    );
  }
}

