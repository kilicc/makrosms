import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'moderator')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    console.log('🧹 Demo veriler temizleniyor...\n');

    // 1. Admin ve testuser'ı bul
    const admin = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    const testuser = await prisma.user.findUnique({
      where: { username: 'testuser' },
    });

    const results: any = {
      adminFound: !!admin,
      testuserFound: !!testuser,
      deletedUsers: 0,
      deletedSms: 0,
      deletedContacts: 0,
      deletedTemplates: 0,
      deletedGroups: 0,
      deletedPaymentRequests: 0,
      deletedPayments: 0,
      deletedRefunds: 0,
    };

    // 2. Testuser'ın verilerini sil
    if (testuser) {
      console.log('📧 Testuser mesajları siliniyor...');
      const deletedSms = await prisma.smsMessage.deleteMany({
        where: { userId: testuser.id },
      });
      results.deletedSms = deletedSms.count;

      console.log('👥 Testuser kişileri siliniyor...');
      const deletedContacts = await prisma.contact.deleteMany({
        where: { userId: testuser.id },
      });
      results.deletedContacts = deletedContacts.count;

      console.log('📋 Testuser şablonları siliniyor...');
      const deletedTemplates = await prisma.smsTemplate.deleteMany({
        where: { userId: testuser.id },
      });
      results.deletedTemplates = deletedTemplates.count;

      console.log('📁 Testuser grup şablonları siliniyor...');
      const deletedGroups = await prisma.contactGroup.deleteMany({
        where: { userId: testuser.id },
      });
      results.deletedGroups = deletedGroups.count;

      console.log('💰 Testuser ödeme talepleri siliniyor...');
      const deletedPaymentRequests = await prisma.paymentRequest.deleteMany({
        where: { userId: testuser.id },
      });
      results.deletedPaymentRequests = deletedPaymentRequests.count;

      console.log('💳 Testuser ödemeleri siliniyor...');
      const deletedPayments = await prisma.payment.deleteMany({
        where: { userId: testuser.id },
      });
      results.deletedPayments = deletedPayments.count;

      console.log('🔄 Testuser iadeleri siliniyor...');
      const deletedRefunds = await prisma.refund.deleteMany({
        where: { userId: testuser.id },
      });
      results.deletedRefunds = deletedRefunds.count;

      // Testuser'ın kredi bilgisini sıfırla
      await prisma.user.update({
        where: { id: testuser.id },
        data: { credit: 0 },
      });
    }

    // 3. Admin ve testuser dışındaki tüm kullanıcıları sil
    console.log('🗑️  Demo kullanıcılar siliniyor...');
    const usersToDelete = await prisma.user.findMany({
      where: {
        AND: [
          { username: { not: 'admin' } },
          { username: { not: 'testuser' } },
        ],
      },
      select: { id: true, username: true },
    });

    for (const user of usersToDelete) {
      // Cascade ile tüm ilişkili veriler otomatik silinecek
      await prisma.user.delete({
        where: { id: user.id },
      });
      results.deletedUsers++;
    }

    // 4. Özet
    const remainingUsers = await prisma.user.count();
    const totalSms = await prisma.smsMessage.count();
    const totalContacts = await prisma.contact.count();
    const totalTemplates = await prisma.smsTemplate.count();

    results.summary = {
      remainingUsers,
      totalSms,
      totalContacts,
      totalTemplates,
    };

    console.log('✅ Demo veriler başarıyla temizlendi!');

    return NextResponse.json({
      success: true,
      message: 'Demo veriler başarıyla temizlendi',
      results,
    });
  } catch (error: any) {
    console.error('❌ Hata:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Demo veriler temizlenirken hata oluştu',
      },
      { status: 500 }
    );
  }
}

