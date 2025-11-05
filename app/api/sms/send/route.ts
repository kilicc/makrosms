import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';
import { sendSMS } from '@/lib/utils/cepSMSProvider';

// POST /api/sms/send - Tekli SMS gönderimi
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
    const { phone, message, serviceName } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, message: 'Telefon numarası ve mesaj gerekli' },
        { status: 400 }
      );
    }

    // Get user to check credit
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { credit: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Check credit
    const userCredit = user.credit || 0;
    if (userCredit < 1) {
      return NextResponse.json(
        {
          success: false,
          message: `Yetersiz kredi. Gerekli: 1, Mevcut: ${userCredit}`,
        },
        { status: 400 }
      );
    }

    // Send SMS
    const smsResult = await sendSMS(phone, message);

    if (smsResult.success && smsResult.messageId) {
      // Create SMS message record
      const smsMessage = await prisma.smsMessage.create({
        data: {
          userId: auth.user.userId,
          phoneNumber: phone,
          message,
          sender: serviceName || null,
          status: 'sent',
          cost: 1,
          cepSmsMessageId: smsResult.messageId,
          sentAt: new Date(),
        },
      });

      // Update user credit
      await prisma.user.update({
        where: { id: auth.user.userId },
        data: {
          credit: {
            decrement: 1,
          },
        },
      });

      // Get updated user credit
      const updatedUser = await prisma.user.findUnique({
        where: { id: auth.user.userId },
        select: { credit: true },
      });

      return NextResponse.json({
        success: true,
        message: 'SMS başarıyla gönderildi',
        data: {
          messageId: smsMessage.id,
          cepSmsMessageId: smsResult.messageId,
          remainingCredit: updatedUser?.credit || 0,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: smsResult.error || 'SMS gönderim hatası',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS gönderim hatası' },
      { status: 500 }
    );
  }
}

