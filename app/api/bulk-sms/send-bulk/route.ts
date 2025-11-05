import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware/auth';
import { sendSMS, formatPhoneNumber } from '@/lib/utils/cepSMSProvider';

// POST /api/bulk-sms/send-bulk - Toplu SMS gönderimi
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
    const { contactIds, message, templateId, sender } = body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kişi listesi gerekli' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mesaj içeriği gerekli' },
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
    const requiredCredit = contactIds.length;
    const userCredit = user.credit || 0;
    if (userCredit < requiredCredit) {
      return NextResponse.json(
        {
          success: false,
          message: `Yetersiz kredi. Gerekli: ${requiredCredit}, Mevcut: ${userCredit}`,
        },
        { status: 400 }
      );
    }

    // Get contacts
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId: auth.user.userId,
        isActive: true,
        isBlocked: false,
      },
    });

    if (contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli kişi bulunamadı' },
        { status: 400 }
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      totalCost: 0,
      messageIds: [] as string[],
      errors: [] as string[],
    };

    // Send SMS to each contact
    for (const contact of contacts) {
      try {
        const smsResult = await sendSMS(contact.phone, message);

        if (smsResult.success && smsResult.messageId) {
          // Create SMS message record
          const smsMessage = await prisma.smsMessage.create({
            data: {
              userId: auth.user.userId,
              contactId: contact.id,
              phoneNumber: contact.phone,
              message,
              sender: sender || null,
              status: 'sent',
              cost: 1,
              cepSmsMessageId: smsResult.messageId,
              sentAt: new Date(),
            },
          });

          // Update contact last contacted
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              lastContacted: new Date(),
              contactCount: { increment: 1 },
            },
          });

          results.sent++;
          results.totalCost += 1;
          results.messageIds.push(smsMessage.id);
        } else {
          results.failed++;
          results.errors.push(`${contact.name}: ${smsResult.error || 'Bilinmeyen hata'}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${contact.name}: ${error.message}`);
      }
    }

    // Update user credit (deduct only successful SMS)
    if (results.sent > 0) {
      await prisma.user.update({
        where: { id: auth.user.userId },
        data: {
          credit: {
            decrement: results.sent,
          },
        },
      });
    }

    // Get updated user credit
    const updatedUser = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { credit: true },
    });

    return NextResponse.json({
      success: true,
      message: `Toplu SMS gönderimi tamamlandı: ${results.sent} başarılı, ${results.failed} başarısız`,
      data: {
        ...results,
        remainingCredit: updatedUser?.credit || 0,
      },
    });
  } catch (error: any) {
    console.error('Bulk SMS error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMS gönderim hatası' },
      { status: 500 }
    );
  }
}

