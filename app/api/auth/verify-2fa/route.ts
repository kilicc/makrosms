import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';
import { verify2FACode } from '@/lib/utils/2fa';

// POST /api/auth/verify-2fa - 2FA kodunu doğrula ve etkinleştir
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
    const { twoFactorCode } = body;

    if (!twoFactorCode) {
      return NextResponse.json(
        { success: false, message: '2FA kodu gerekli' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: '2FA secret bulunamadı' },
        { status: 404 }
      );
    }

    // Verify 2FA code
    const isValid = verify2FACode(user.twoFactorSecret, twoFactorCode);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz 2FA kodu' },
        { status: 400 }
      );
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: auth.user.userId },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({
      success: true,
      message: '2FA başarıyla etkinleştirildi',
    });
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '2FA doğrulama hatası' },
      { status: 500 }
    );
  }
}

