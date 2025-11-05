import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/contacts - Kişi listesi
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const group = searchParams.get('group');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const isBlocked = searchParams.get('isBlocked');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: auth.user.userId,
    };

    if (group) {
      where.groupId = group;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (isBlocked !== null) {
      where.isBlocked = isBlocked === 'true';
    }

    // Get contacts and total count
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kişi listesi hatası' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Kişi ekleme
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
    const { name, phone, email, notes, tags, groupId } = body;

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'İsim ve telefon numarası gerekli' },
        { status: 400 }
      );
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: auth.user.userId,
        phone,
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { success: false, message: 'Bu telefon numarası zaten kayıtlı' },
        { status: 400 }
      );
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        userId: auth.user.userId,
        name,
        phone,
        email: email || null,
        notes: notes || null,
        tags: tags || [],
        groupId: groupId || null,
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

    // Update group contact count if groupId exists
    if (groupId) {
      await prisma.contactGroup.update({
        where: { id: groupId },
        data: {
          contactCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Kişi başarıyla eklendi',
      data: { contact },
    });
  } catch (error: any) {
    console.error('Contacts POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kişi ekleme hatası' },
      { status: 500 }
    );
  }
}

