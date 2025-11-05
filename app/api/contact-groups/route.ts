import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/contact-groups - Grup listesi
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groups = await prisma.contactGroup.findMany({
      where: {
        userId: auth.user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: { groups },
    });
  } catch (error: any) {
    console.error('Contact groups GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Grup listesi hatası' },
      { status: 500 }
    );
  }
}

// POST /api/contact-groups - Grup oluşturma
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
    const { name, description, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Grup adı gerekli' },
        { status: 400 }
      );
    }

    // Check if group already exists
    const existingGroup = await prisma.contactGroup.findFirst({
      where: {
        userId: auth.user.userId,
        name,
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { success: false, message: 'Bu grup adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Create group
    const group = await prisma.contactGroup.create({
      data: {
        userId: auth.user.userId,
        name,
        description: description || null,
        color: color || '#1976d2',
        icon: icon || 'group',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Grup oluşturuldu',
      data: { group },
    });
  } catch (error: any) {
    console.error('Contact groups POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Grup oluşturma hatası' },
      { status: 500 }
    );
  }
}

