import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';

// POST /api/contacts/import - Toplu kişi import
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
    const { contacts, groupId } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kişi listesi gerekli' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get existing contacts for this user using Supabase
    const { data: existingContacts } = await supabaseServer
      .from('contacts')
      .select('phone')
      .eq('user_id', auth.user.userId);

    const existingPhones = new Set((existingContacts || []).map((c: any) => c.phone));

    // Create contacts using Supabase
    const contactsToInsert: any[] = [];
    for (const contactData of contacts) {
      try {
        const { name, phone, email } = contactData;

        if (!name || !phone) {
          results.failed++;
          results.errors.push(`${phone || 'Unknown'}: İsim ve telefon gerekli`);
          continue;
        }

        // Check if phone already exists
        if (existingPhones.has(phone)) {
          results.failed++;
          results.errors.push(`${phone}: Zaten kayıtlı`);
          continue;
        }

        contactsToInsert.push({
          user_id: auth.user.userId,
          name,
          phone,
          email: email || null,
          group_id: groupId || null,
        });

        existingPhones.add(phone);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${contactData.phone || 'Unknown'}: ${error.message}`);
      }
    }

    // Bulk insert contacts using Supabase
    if (contactsToInsert.length > 0) {
      const { error: insertError } = await supabaseServer
        .from('contacts')
        .insert(contactsToInsert);

      if (insertError) {
        return NextResponse.json(
          { success: false, message: insertError.message || 'Kişiler import edilemedi' },
          { status: 500 }
        );
      }
    }

    // Update group contact count if groupId exists
    if (groupId && results.success > 0) {
      // Get current count
      const { data: groupData } = await supabaseServer
        .from('contact_groups')
        .select('contact_count')
        .eq('id', groupId)
        .single();

      if (groupData) {
        await supabaseServer
          .from('contact_groups')
          .update({ contact_count: (groupData.contact_count || 0) + results.success })
          .eq('id', groupId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import tamamlandı: ${results.success} başarılı, ${results.failed} başarısız`,
      data: results,
    });
  } catch (error: any) {
    console.error('Contacts import error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Import hatası' },
      { status: 500 }
    );
  }
}

