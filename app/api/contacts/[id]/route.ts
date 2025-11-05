import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';

// PUT /api/contacts/:id - Kişi güncelleme
export async function PUT(
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
    const body = await request.json();
    const { name, phone, email, notes, tags, groupId } = body;

    // Check if contact exists and belongs to user using Supabase
    const { data: existingContact, error: checkError } = await supabaseServer
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.user.userId)
      .single();

    if (checkError || !existingContact) {
      return NextResponse.json(
        { success: false, message: 'Kişi bulunamadı' },
        { status: 404 }
      );
    }

    // Update contact using Supabase
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (notes !== undefined) updateData.notes = notes;
    if (tags) updateData.tags = tags;
    if (groupId !== undefined) updateData.group_id = groupId;

    const { data: contactData, error: updateError } = await supabaseServer
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select('*, contact_groups(id, name, color)')
      .single();

    if (updateError || !contactData) {
      return NextResponse.json(
        { success: false, message: updateError?.message || 'Kişi güncellenemedi' },
        { status: 500 }
      );
    }

    // Format contact data
    const contact = {
      id: contactData.id,
      userId: contactData.user_id,
      groupId: contactData.group_id,
      name: contactData.name,
      phone: contactData.phone,
      email: contactData.email,
      notes: contactData.notes,
      tags: contactData.tags || [],
      isActive: contactData.is_active ?? true,
      isBlocked: contactData.is_blocked ?? false,
      lastContacted: contactData.last_contacted,
      contactCount: contactData.contact_count || 0,
      createdAt: contactData.created_at,
      updatedAt: contactData.updated_at,
      group: contactData.contact_groups ? {
        id: contactData.contact_groups.id,
        name: contactData.contact_groups.name,
        color: contactData.contact_groups.color,
      } : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Kişi güncellendi',
      data: { contact },
    });
  } catch (error: any) {
    console.error('Contact PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kişi güncelleme hatası' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/:id - Kişi silme
export async function DELETE(
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
      .select('group_id')
      .eq('id', id)
      .eq('user_id', auth.user.userId)
      .single();

    if (checkError || !contact) {
      return NextResponse.json(
        { success: false, message: 'Kişi bulunamadı' },
        { status: 404 }
      );
    }

    // Delete contact using Supabase
    const { error: deleteError } = await supabaseServer
      .from('contacts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: deleteError.message || 'Kişi silinemedi' },
        { status: 500 }
      );
    }

    // Update group contact count if groupId exists
    if (contact.group_id) {
      // Get current count
      const { data: groupData } = await supabaseServer
        .from('contact_groups')
        .select('contact_count')
        .eq('id', contact.group_id)
        .single();

      if (groupData) {
        await supabaseServer
          .from('contact_groups')
          .update({ contact_count: Math.max(0, (groupData.contact_count || 0) - 1) })
          .eq('id', contact.group_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kişi silindi',
    });
  } catch (error: any) {
    console.error('Contact DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kişi silme hatası' },
      { status: 500 }
    );
  }
}

