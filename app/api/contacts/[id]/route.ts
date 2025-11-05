import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { success: false, message: 'Kişi bulunamadı' },
        { status: 404 }
      );
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: name || existingContact.name,
        phone: phone || existingContact.phone,
        email: email !== undefined ? email : existingContact.email,
        notes: notes !== undefined ? notes : existingContact.notes,
        tags: tags || existingContact.tags,
        groupId: groupId !== undefined ? groupId : existingContact.groupId,
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

    // Delete contact
    await prisma.contact.delete({
      where: { id },
    });

    // Update group contact count if groupId exists
    if (contact.groupId) {
      await prisma.contactGroup.update({
        where: { id: contact.groupId },
        data: {
          contactCount: {
            decrement: 1,
          },
        },
      });
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

