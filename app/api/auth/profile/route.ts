import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        credit: true,
        role: true,
        isVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Profil hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, username } = body;

    const updateData: any = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;

    const user = await prisma.user.update({
      where: { id: auth.user.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        credit: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profil güncellendi',
      data: { user },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Profil güncelleme hatası' },
      { status: 500 }
    );
  }
}

