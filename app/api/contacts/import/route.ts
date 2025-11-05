import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Get existing contacts for this user
    const existingContacts = await prisma.contact.findMany({
      where: {
        userId: auth.user.userId,
      },
      select: {
        phone: true,
      },
    });

    const existingPhones = new Set(existingContacts.map((c) => c.phone));

    // Create contacts
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

        // Create contact
        await prisma.contact.create({
          data: {
            userId: auth.user.userId,
            name,
            phone,
            email: email || null,
            groupId: groupId || null,
          },
        });

        existingPhones.add(phone);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${contactData.phone || 'Unknown'}: ${error.message}`);
      }
    }

    // Update group contact count if groupId exists
    if (groupId && results.success > 0) {
      await prisma.contactGroup.update({
        where: { id: groupId },
        data: {
          contactCount: {
            increment: results.success,
          },
        },
      });
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

