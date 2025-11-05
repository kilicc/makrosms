import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// PUT /api/sms-templates/:id - Şablon güncelleme
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
    const { name, content, category, variables, isActive } = body;

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.smsTemplate.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Şablon bulunamadı' },
        { status: 404 }
      );
    }

    // Update template
    const template = await prisma.smsTemplate.update({
      where: { id },
      data: {
        name: name || existingTemplate.name,
        content: content || existingTemplate.content,
        category: category || existingTemplate.category,
        variables: variables || existingTemplate.variables,
        isActive: isActive !== undefined ? isActive : existingTemplate.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Şablon güncellendi',
      data: { template },
    });
  } catch (error: any) {
    console.error('SMS template PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Şablon güncelleme hatası' },
      { status: 500 }
    );
  }
}

// DELETE /api/sms-templates/:id - Şablon silme
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

    // Check if template exists and belongs to user
    const template = await prisma.smsTemplate.findFirst({
      where: {
        id,
        userId: auth.user.userId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Şablon bulunamadı' },
        { status: 404 }
      );
    }

    // Delete template
    await prisma.smsTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Şablon silindi',
    });
  } catch (error: any) {
    console.error('SMS template DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Şablon silme hatası' },
      { status: 500 }
    );
  }
}

