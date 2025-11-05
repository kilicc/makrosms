import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
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

    // Get user using Supabase
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('password_hash')
      .eq('id', auth.user.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
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

    // Update password using Supabase
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', auth.user.userId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message || 'Şifre güncellenemedi' },
        { status: 500 }
      );
    }

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

