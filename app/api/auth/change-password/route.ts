import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';
import { verifyPassword, hashPassword } from '@/lib/utils/password';

// PUT /api/auth/change-password - Şifre değiştirme
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Mevcut şifre ve yeni şifre gerekli' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Mevcut şifre hatalı' },
        { status: 400 }
      );
    }

    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Yeni şifre en az 8 karakter olmalı' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: auth.user.userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Şifre değiştirme hatası' },
      { status: 500 }
    );
  }
}

