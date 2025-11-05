import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';
import { verify2FACode } from '@/lib/utils/2fa';
import { verifyPassword } from '@/lib/utils/password';

// POST /api/auth/disable-2fa - 2FA devre dışı bırak
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
    const { twoFactorCode, password } = body;

    if (!twoFactorCode || !password) {
      return NextResponse.json(
        { success: false, message: '2FA kodu ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        passwordHash: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: '2FA aktif değil' },
        { status: 400 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Şifre hatalı' },
        { status: 400 }
      );
    }

    // Verify 2FA code
    if (user.twoFactorSecret) {
      const isValid2FA = verify2FACode(user.twoFactorSecret, twoFactorCode);
      if (!isValid2FA) {
        return NextResponse.json(
          { success: false, message: 'Geçersiz 2FA kodu' },
          { status: 400 }
        );
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: auth.user.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA başarıyla devre dışı bırakıldı',
    });
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '2FA devre dışı bırakma hatası' },
      { status: 500 }
    );
  }
}

