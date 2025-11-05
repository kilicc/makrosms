import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/utils/password';
import { generateToken } from '@/lib/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, password, twoFactorCode } = body;

    // Validation
    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı/email ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: login }, { email: login }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // 2FA check (TODO: Implement 2FA verification)
    if (user.twoFactorEnabled && !twoFactorCode) {
      return NextResponse.json(
        { success: false, message: '2FA kodu gerekli', requires2FA: true },
        { status: 200 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role || 'user',
    });

    const refreshToken = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role || 'user',
    });

    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          credit: user.credit || 0,
          role: user.role || 'user',
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Giriş hatası' },
      { status: 500 }
    );
  }
}

