import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
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

    // Get user using Supabase
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('username, two_factor_enabled')
      .eq('id', auth.user.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    if (user.two_factor_enabled) {
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
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({ two_factor_secret: secret })
      .eq('id', auth.user.userId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message || '2FA secret kaydedilemedi' },
        { status: 500 }
      );
    }

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

