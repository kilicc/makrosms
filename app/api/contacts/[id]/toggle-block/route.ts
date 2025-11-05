import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';

// PATCH /api/contacts/:id/toggle-block - Kişi engelleme/engeli kaldırma
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if contact exists and belongs to user using Supabase
    const { data: contact, error: checkError } = await supabaseServer
      .from('contacts')
      .select('is_blocked')
      .eq('id', id)
      .eq('user_id', auth.user.userId)
      .single();

    if (checkError || !contact) {
      return NextResponse.json(
        { success: false, message: 'Kişi bulunamadı' },
        { status: 404 }
      );
    }

    // Toggle block status using Supabase
    const newBlockStatus = !contact.is_blocked;
    const { data: updatedContactData, error: updateError } = await supabaseServer
      .from('contacts')
      .update({ is_blocked: newBlockStatus })
      .eq('id', id)
      .select('*, contact_groups(id, name, color)')
      .single();

    if (updateError || !updatedContactData) {
      return NextResponse.json(
        { success: false, message: updateError?.message || 'Kişi güncellenemedi' },
        { status: 500 }
      );
    }

    // Format contact data
    const updatedContact = {
      id: updatedContactData.id,
      userId: updatedContactData.user_id,
      groupId: updatedContactData.group_id,
      name: updatedContactData.name,
      phone: updatedContactData.phone,
      email: updatedContactData.email,
      notes: updatedContactData.notes,
      tags: updatedContactData.tags || [],
      isActive: updatedContactData.is_active ?? true,
      isBlocked: updatedContactData.is_blocked ?? false,
      lastContacted: updatedContactData.last_contacted,
      contactCount: updatedContactData.contact_count || 0,
      createdAt: updatedContactData.created_at,
      updatedAt: updatedContactData.updated_at,
      group: updatedContactData.contact_groups ? {
        id: updatedContactData.contact_groups.id,
        name: updatedContactData.contact_groups.name,
        color: updatedContactData.contact_groups.color,
      } : null,
    };

    return NextResponse.json({
      success: true,
      message: updatedContact.isBlocked ? 'Kişi engellendi' : 'Kişi engeli kaldırıldı',
      data: { contact: updatedContact },
    });
  } catch (error: any) {
    console.error('Contact toggle-block error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İşlem hatası' },
      { status: 500 }
    );
  }
}

