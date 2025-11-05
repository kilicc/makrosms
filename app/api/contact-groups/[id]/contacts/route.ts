import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/contact-groups/:id/contacts - Grup içindeki kişiler
export async function GET(
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

    // Check if group exists and belongs to user
    const group = await prisma.contactGroup.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Grup bulunamadı' },
        { status: 404 }
      );
    }

    // Get contacts in group
    const contacts = await prisma.contact.findMany({
      where: {
        userId: auth.user.userId,
        groupId: id,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: { contacts, group },
    });
  } catch (error: any) {
    console.error('Group contacts GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kişi listesi hatası' },
      { status: 500 }
    );
  }
}

