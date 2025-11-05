import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
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

    // Get user using Supabase
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('password_hash, two_factor_secret, two_factor_enabled')
      .eq('id', auth.user.userId)
      .single();

    if (userError || !user || !user.two_factor_enabled) {
      return NextResponse.json(
        { success: false, message: '2FA aktif değil' },
        { status: 400 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Şifre hatalı' },
        { status: 400 }
      );
    }

    // Verify 2FA code
    if (user.two_factor_secret) {
      const isValid2FA = verify2FACode(user.two_factor_secret, twoFactorCode);
      if (!isValid2FA) {
        return NextResponse.json(
          { success: false, message: 'Geçersiz 2FA kodu' },
          { status: 400 }
        );
      }
    }

    // Disable 2FA using Supabase
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
      })
      .eq('id', auth.user.userId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message || '2FA devre dışı bırakılamadı' },
        { status: 500 }
      );
    }

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

