import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/contacts/search - Kişi arama
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
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!q) {
      return NextResponse.json(
        { success: false, message: 'Arama terimi gerekli' },
        { status: 400 }
      );
    }

    const contacts = await prisma.contact.findMany({
      where: {
        userId: auth.user.userId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
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
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: { contacts },
    });
  } catch (error: any) {
    console.error('Contacts search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Arama hatası' },
      { status: 500 }
    );
  }
}

