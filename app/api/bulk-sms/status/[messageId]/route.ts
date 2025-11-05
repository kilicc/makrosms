import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/bulk-sms/status/:messageId - SMS durumu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = await params;

    const message = await prisma.smsMessage.findFirst({
      where: {
        id: messageId,
        userId: auth.user.userId,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'SMS mesajı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message },
    });
  } catch (error: any) {
    console.error('SMS status error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS durumu hatası' },
      { status: 500 }
    );
  }
}

