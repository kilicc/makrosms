import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/contacts/search - Kişi arama
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
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!q) {
      return NextResponse.json(
        { success: false, message: 'Arama terimi gerekli' },
        { status: 400 }
      );
    }

    // Search using Supabase with case-insensitive ilike
    const { data: contactsData, error } = await supabaseServer
      .from('contacts')
      .select('*, contact_groups(id, name, color)')
      .eq('user_id', auth.user.userId)
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    // Format contacts data
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

    return NextResponse.json({
      success: true,
      data: { contacts },
    });
  } catch (error: any) {
    console.error('Contacts search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Arama hatası' },
      { status: 500 }
    );
  }
}

