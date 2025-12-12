import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';

// POST /api/admin/users/:userId/credit - Kredi yükleme
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

    // Admin kredisi yüklemek için sadece admin2 yetkili
    // Kullanıcının username'ini kontrol et
    const { data: currentAdminUser, error: adminUserError } = await supabaseServer
      .from('users')
      .select('username, role')
      .eq('id', auth.user.userId)
      .single();

    if (adminUserError || !currentAdminUser) {
      return NextResponse.json(
        { success: false, message: 'Admin kullanıcısı bulunamadı' },
        { status: 404 }
      );
    }

    // Hedef kullanıcının rolünü kontrol et
    const { data: targetUser, error: targetUserError } = await supabaseServer
      .from('users')
      .select('role, visible_to_admin_id')
      .eq('id', userId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { success: false, message: 'Hedef kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Gizli kullanıcı kontrolü: Eğer kullanıcının visible_to_admin_id'si varsa ve mevcut admin'in ID'si ile eşleşmiyorsa, erişim reddedilir
    if (targetUser.visible_to_admin_id && targetUser.visible_to_admin_id !== auth.user.userId) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Admin kullanıcılarına kredi yüklemek için sadece admin2 yetkili
    const targetIsAdmin = targetUser.role === 'admin' || targetUser.role === 'administrator' || targetUser.role === 'moderator';
    if (targetIsAdmin && currentAdminUser.username !== 'admin2') {
      return NextResponse.json(
        { success: false, message: 'Admin kullanıcılarına kredi yüklemek için admin2 yetkisi gerekli' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir kredi miktarı gerekli' },
        { status: 400 }
      );
    }

    // Check if user exists using Supabase (zaten yukarıda kontrol ettik, ama credit için tekrar alalım)
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, credit, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Update user credit using Supabase
    const currentCredit = user.credit || 0;
    const newCredit = currentCredit + Math.round(amount);
    
    // Eğer admin kullanıcısına kredi yükleniyorsa, tüm adminleri senkronize et
    const userIsAdmin = user.role === 'admin' || user.role === 'administrator' || user.role === 'moderator';
    
    if (userIsAdmin) {
      // Tüm admin kullanıcılarına aynı krediyi ver (sistem kredisi senkronizasyonu)
      const { error: syncError } = await supabaseServer
        .from('users')
        .update({ credit: newCredit })
        .in('role', ['admin', 'administrator', 'moderator']);
      
      if (syncError) {
        console.error('Admin kredileri senkronize edilemedi:', syncError);
        return NextResponse.json(
          { success: false, message: 'Admin kredileri senkronize edilemedi' },
          { status: 500 }
        );
      }
    }
    
    // Normal kullanıcı için sadece o kullanıcıyı güncelle (admin için zaten yukarıda güncellendi)
    const { data: updatedUser, error: updateError } = userIsAdmin 
      ? await supabaseServer
          .from('users')
          .select('id, username, email, credit, role')
          .eq('id', userId)
          .single()
      : await supabaseServer
          .from('users')
          .update({ credit: newCredit })
          .eq('id', userId)
          .select('id, username, email, credit, role')
          .single();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { success: false, message: updateError?.message || 'Kredi yüklenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kredi yüklendi',
      data: {
        user: updatedUser,
        creditAdded: Math.round(amount),
        reason: reason || 'Admin kredi yükleme',
      },
    });
  } catch (error: any) {
    console.error('Admin credit POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kredi yükleme hatası' },
      { status: 500 }
    );
  }
}

