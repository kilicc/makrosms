import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/contacts - Kişi listesi
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const group = searchParams.get('group');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const isBlocked = searchParams.get('isBlocked');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build Supabase query
    let query = supabaseServer
      .from('contacts')
      .select('*, contact_groups(id, name, color)', { count: 'exact' })
      .eq('user_id', auth.user.userId);

    if (group) {
      if (group === 'none') {
        query = query.is('group_id', null);
      } else {
        query = query.eq('group_id', group);
      }
    }

    if (search) {
      // Case-insensitive search using ilike
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (isBlocked !== null) {
      query = query.eq('is_blocked', isBlocked === 'true');
    }

    // Get contacts and total count
    const { data: contactsData, count, error: contactsError } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (contactsError) {
      throw new Error(contactsError.message);
    }

    // Format contacts data (snake_case to camelCase)
    const contacts = (contactsData || []).map((contact: any) => ({
      id: contact.id,
      userId: contact.user_id,
      groupId: contact.group_id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      notes: contact.notes,
      tags: contact.tags || [],
      isActive: contact.is_active ?? true,
      isBlocked: contact.is_blocked ?? false,
      lastContacted: contact.last_contacted,
      contactCount: contact.contact_count || 0,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
      group: contact.contact_groups ? {
        id: contact.contact_groups.id,
        name: contact.contact_groups.name,
        color: contact.contact_groups.color,
      } : null,
    }));

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kişi listesi hatası' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Kişi ekleme
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
    const { name, phone, email, notes, tags, groupId } = body;

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'İsim ve telefon numarası gerekli' },
        { status: 400 }
      );
    }

    // Check if contact already exists using Supabase
    const { data: existingContacts, error: checkError } = await supabaseServer
      .from('contacts')
      .select('id')
      .eq('user_id', auth.user.userId)
      .eq('phone', phone)
      .limit(1);

    if (checkError || (existingContacts && existingContacts.length > 0)) {
      return NextResponse.json(
        { success: false, message: 'Bu telefon numarası zaten kayıtlı' },
        { status: 400 }
      );
    }

    // Create contact using Supabase
    const { data: contactData, error: createError } = await supabaseServer
      .from('contacts')
      .insert({
        user_id: auth.user.userId,
        name,
        phone,
        email: email || null,
        notes: notes || null,
        tags: tags || [],
        group_id: groupId || null,
      })
      .select('*, contact_groups(id, name, color)')
      .single();

    if (createError || !contactData) {
      return NextResponse.json(
        { success: false, message: createError?.message || 'Kişi oluşturulamadı' },
        { status: 500 }
      );
    }

    // Update group contact count if groupId exists
    if (groupId) {
      // Get current count
      const { data: groupData } = await supabaseServer
        .from('contact_groups')
        .select('contact_count')
        .eq('id', groupId)
        .single();

      if (groupData) {
        await supabaseServer
          .from('contact_groups')
          .update({ contact_count: (groupData.contact_count || 0) + 1 })
          .eq('id', groupId);
      }
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
      message: 'Kişi başarıyla eklendi',
      data: { contact },
    });
  } catch (error: any) {
    console.error('Contacts POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kişi ekleme hatası' },
      { status: 500 }
    );
  }
}

