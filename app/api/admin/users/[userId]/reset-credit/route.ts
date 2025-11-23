import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// POST /api/admin/users/:userId/reset-credit - Kredi sıfırlama
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!requireAdmin(auth.user)) {
      return NextResponse.json(
        { success: false, message: 'Admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const { userId } = await params;

    // Check if user exists using Supabase
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, username, credit, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Update user credit to 0 using Supabase
    const { data: updatedUser, error: updateError } = await supabaseServer
      .from('users')
      .update({ credit: 0 })
      .eq('id', userId)
      .select('id, username, email, credit')
      .single();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { success: false, message: updateError?.message || 'Kredi sıfırlanamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${user.username} kullanıcısının kredisi sıfırlandı`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error: any) {
    console.error('Reset credit error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kredi sıfırlama hatası' },
      { status: 500 }
    );
  }
}

