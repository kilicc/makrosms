import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';
import { generate2FASecret, generateQRCode } from '@/lib/utils/2fa';

// POST /api/auth/enable-2fa - 2FA etkinleştir
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { username: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: '2FA zaten aktif' },
        { status: 400 }
      );
    }

    // Generate 2FA secret
    const { secret, otpauthUrl } = generate2FASecret(user.username);

    // Generate QR code
    const qrCode = await generateQRCode(otpauthUrl);

    // Save secret to user (but don't enable yet - user needs to verify first)
    await prisma.user.update({
      where: { id: auth.user.userId },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCode,
        otpauthUrl,
      },
    });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '2FA etkinleştirme hatası' },
      { status: 500 }
    );
  }
}

