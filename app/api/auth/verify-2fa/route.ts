import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
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

    // Get user using Supabase
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('two_factor_secret, two_factor_enabled')
      .eq('id', auth.user.userId)
      .single();

    if (userError || !user || !user.two_factor_secret) {
      return NextResponse.json(
        { success: false, message: '2FA secret bulunamadı' },
        { status: 404 }
      );
    }

    // Verify 2FA code
    const isValid = verify2FACode(user.two_factor_secret, twoFactorCode);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz 2FA kodu' },
        { status: 400 }
      );
    }

    // Enable 2FA using Supabase
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', auth.user.userId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message || '2FA etkinleştirilemedi' },
        { status: 500 }
      );
    }

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

