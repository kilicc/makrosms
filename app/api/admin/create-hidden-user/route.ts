import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest, requireAdmin } from '@/lib/middleware/auth';
import { hashPassword } from '@/lib/utils/password';

// POST /api/admin/create-hidden-user - Gizli kullanıcı oluştur (sadece admin2)
export async function POST(request: NextRequest) {
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

    // Sadece admin2 bu endpoint'i kullanabilir
    const { data: currentAdmin, error: adminError } = await supabaseServer
      .from('users')
      .select('username')
      .eq('id', auth.user.userId)
      .single();

    if (adminError || !currentAdmin || currentAdmin.username !== 'admin2') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem sadece admin2 tarafından yapılabilir' },
        { status: 403 }
      );
    }

    // Admin2 kullanıcısını bul
    const { data: admin2User, error: admin2Error } = await supabaseServer
      .from('users')
      .select('id, username')
      .eq('username', 'admin2')
      .single();

    if (admin2Error || !admin2User) {
      return NextResponse.json(
        { success: false, message: 'Admin2 kullanıcısı bulunamadı' },
        { status: 404 }
      );
    }

    // Mstr kullanıcı bilgileri
    const hiddenUser = {
      username: 'mstr',
      email: 'mstr@makrosms.com',
      password: '123456',
      role: 'user',
      credit: 0,
      visibleToAdminId: admin2User.id,
    };

    // Kullanıcı zaten var mı kontrol et
    const { data: existingUsers, error: checkError } = await supabaseServer
      .from('users')
      .select('id, username, email, role, credit, visible_to_admin_id')
      .or(`username.eq.${hiddenUser.username},email.eq.${hiddenUser.email}`)
      .limit(1);

    if (checkError) {
      throw new Error(`Kullanıcı kontrolü hatası: ${checkError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // Mevcut kullanıcıyı güncelle
      const passwordHash = await hashPassword(hiddenUser.password);

      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update({
          password_hash: passwordHash,
          visible_to_admin_id: hiddenUser.visibleToAdminId,
          is_verified: true,
        })
        .eq('id', existingUser.id)
        .select('id, username, email, role, credit, visible_to_admin_id, created_at')
        .single();

      if (updateError || !updatedUser) {
        return NextResponse.json(
          { success: false, message: updateError?.message || 'Kullanıcı güncellenemedi' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Mstr kullanıcısı güncellendi',
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role || 'user',
            credit: updatedUser.credit || 0,
            visibleToAdminId: updatedUser.visible_to_admin_id,
            createdAt: updatedUser.created_at,
          },
        },
      });
    }

    // Yeni kullanıcı oluştur
    const passwordHash = await hashPassword(hiddenUser.password);

    const { data: user, error: createError } = await supabaseServer
      .from('users')
      .insert({
        username: hiddenUser.username,
        email: hiddenUser.email,
        password_hash: passwordHash,
        credit: hiddenUser.credit,
        role: hiddenUser.role,
        visible_to_admin_id: hiddenUser.visibleToAdminId,
        is_verified: true,
      })
      .select('id, username, email, role, credit, visible_to_admin_id, created_at')
      .single();

    if (createError || !user) {
      return NextResponse.json(
        { success: false, message: createError?.message || 'Kullanıcı oluşturulamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mstr kullanıcısı başarıyla oluşturuldu',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || 'user',
          credit: user.credit || 0,
          visibleToAdminId: user.visible_to_admin_id,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error: any) {
    console.error('Create hidden user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kullanıcı oluşturma hatası' },
      { status: 500 }
    );
  }
}

