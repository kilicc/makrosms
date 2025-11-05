import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Get statistics
    const [
      totalContacts,
      activeContacts,
      blockedContacts,
      contactsByGroup,
      failedSMS,
    ] = await Promise.all([
      prisma.contact.count({
        where: { userId: auth.user.userId },
      }),
      prisma.contact.count({
        where: {
          userId: auth.user.userId,
          isActive: true,
        },
      }),
      prisma.contact.count({
        where: {
          userId: auth.user.userId,
          isBlocked: true,
        },
      }),
      prisma.contactGroup.findMany({
        where: { userId: auth.user.userId },
        select: {
          id: true,
          name: true,
          contactCount: true,
        },
      }),
      prisma.smsMessage.count({
        where: {
          userId: auth.user.userId,
          status: 'failed',
        },
      }),
    ]);

    const contactsByGroupMap: Record<string, number> = {};
    contactsByGroup.forEach((group) => {
      contactsByGroupMap[group.id] = group.contactCount || 0;
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

