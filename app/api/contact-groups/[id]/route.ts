import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// PUT /api/contact-groups/:id - Grup güncelleme
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
    const { name, description, color, icon } = body;

    // Check if group exists and belongs to user
    const existingGroup = await prisma.contactGroup.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { success: false, message: 'Grup bulunamadı' },
        { status: 404 }
      );
    }

    // Update group
    const group = await prisma.contactGroup.update({
      where: { id },
      data: {
        name: name || existingGroup.name,
        description: description !== undefined ? description : existingGroup.description,
        color: color || existingGroup.color,
        icon: icon || existingGroup.icon,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Grup güncellendi',
      data: { group },
    });
  } catch (error: any) {
    console.error('Contact group PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Grup güncelleme hatası' },
      { status: 500 }
    );
  }
}

// DELETE /api/contact-groups/:id - Grup silme
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

    // Delete group (contacts will have groupId set to null due to onDelete: SetNull)
    await prisma.contactGroup.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Grup silindi',
    });
  } catch (error: any) {
    console.error('Contact group DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Grup silme hatası' },
      { status: 500 }
    );
  }
}

