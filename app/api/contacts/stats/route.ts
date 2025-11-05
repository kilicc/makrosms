import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/contacts/stats - Kişi istatistikleri
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get statistics using Supabase
    const [
      totalContactsResult,
      activeContactsResult,
      blockedContactsResult,
      contactsByGroupResult,
      failedSMSResult,
    ] = await Promise.all([
      supabaseServer
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.userId),
      supabaseServer
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.userId)
        .eq('is_active', true),
      supabaseServer
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.userId)
        .eq('is_blocked', true),
      supabaseServer
        .from('contact_groups')
        .select('id, name, contact_count')
        .eq('user_id', auth.user.userId),
      supabaseServer
        .from('sms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.userId)
        .eq('status', 'failed'),
    ]);

    const totalContacts = totalContactsResult.count || 0;
    const activeContacts = activeContactsResult.count || 0;
    const blockedContacts = blockedContactsResult.count || 0;
    const contactsByGroup = contactsByGroupResult.data || [];
    const failedSMS = failedSMSResult.count || 0;

    const contactsByGroupMap: Record<string, number> = {};
    contactsByGroup.forEach((group: any) => {
      contactsByGroupMap[group.id] = group.contact_count || 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalContacts: totalContacts || 0,
        activeContacts: activeContacts || 0,
        blockedContacts: blockedContacts || 0,
        contactsByGroup: contactsByGroupMap,
        failedSMS: failedSMS || 0,
      },
    });
  } catch (error: any) {
    console.error('Contacts stats error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İstatistik hatası' },
      { status: 500 }
    );
  }
}

