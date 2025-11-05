import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/password';
import { generateToken } from '@/lib/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı, email ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı veya email zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        credit: 0,
        role: 'user',
      },
      select: {
        id: true,
        username: true,
        email: true,
        credit: true,
        role: true,
        createdAt: true,
      },
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
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kayıt hatası' },
      { status: 500 }
    );
  }
}

