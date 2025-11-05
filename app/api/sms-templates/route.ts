import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';

// GET /api/sms-templates - Şablon listesi
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templates = await prisma.smsTemplate.findMany({
      where: {
        userId: auth.user.userId,
        isActive: true,
      },
      orderBy: {
        usageCount: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: { templates },
    });
  } catch (error: any) {
    console.error('SMS templates GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Şablon listesi hatası' },
      { status: 500 }
    );
  }
}

// POST /api/sms-templates - Şablon oluşturma
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
    const { name, content, category, variables } = body;

    if (!name || !content) {
      return NextResponse.json(
        { success: false, message: 'Şablon adı ve içeriği gerekli' },
        { status: 400 }
      );
    }

    // Check if template already exists
    const existingTemplate = await prisma.smsTemplate.findFirst({
      where: {
        userId: auth.user.userId,
        name,
      },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Bu şablon adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Create template
    const template = await prisma.smsTemplate.create({
      data: {
        userId: auth.user.userId,
        name,
        content,
        category: category || 'Genel',
        variables: variables || [],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Şablon oluşturuldu',
      data: { template },
    });
  } catch (error: any) {
    console.error('SMS template POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Şablon oluşturma hatası' },
      { status: 500 }
    );
  }
}

