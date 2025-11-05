import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Kişi bulunamadı' },
        { status: 404 }
      );
    }

    // Toggle block status
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        isBlocked: !contact.isBlocked,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

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

