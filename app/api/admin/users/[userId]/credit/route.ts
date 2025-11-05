import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// POST /api/admin/users/:userId/credit - Kredi yükleme
export async function POST(
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
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir kredi miktarı gerekli' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Update user credit
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credit: {
          increment: Math.round(amount),
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        credit: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kredi yüklendi',
      data: {
        user: updatedUser,
        creditAdded: Math.round(amount),
        reason: reason || 'Admin kredi yükleme',
      },
    });
  } catch (error: any) {
    console.error('Admin credit POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kredi yükleme hatası' },
      { status: 500 }
    );
  }
}

