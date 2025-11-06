import { prisma } from '../lib/prisma';

async function cleanupDemoData() {
  try {
    console.log('🧹 Demo veriler temizleniyor...\n');

    // 1. Admin ve testuser'ı bul
    const admin = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    const testuser = await prisma.user.findUnique({
      where: { username: 'testuser' },
    });

    if (!admin) {
      console.log('⚠️  Admin kullanıcısı bulunamadı!');
    } else {
      console.log('✅ Admin kullanıcısı bulundu:', admin.username);
    }

    if (!testuser) {
      console.log('⚠️  Testuser kullanıcısı bulunamadı!');
    } else {
      console.log('✅ Testuser kullanıcısı bulundu:', testuser.username);
    }

    // 2. Testuser'ın verilerini sil
    if (testuser) {
      console.log('\n📧 Testuser mesajları siliniyor...');
      const deletedSms = await prisma.smsMessage.deleteMany({
        where: { userId: testuser.id },
      });
      console.log(`   ✅ ${deletedSms.count} mesaj silindi`);

      console.log('👥 Testuser kişileri siliniyor...');
      const deletedContacts = await prisma.contact.deleteMany({
        where: { userId: testuser.id },
      });
      console.log(`   ✅ ${deletedContacts.count} kişi silindi`);

      console.log('📋 Testuser şablonları siliniyor...');
      const deletedTemplates = await prisma.smsTemplate.deleteMany({
        where: { userId: testuser.id },
      });
      console.log(`   ✅ ${deletedTemplates.count} şablon silindi`);

      console.log('📁 Testuser grup şablonları siliniyor...');
      const deletedGroups = await prisma.contactGroup.deleteMany({
        where: { userId: testuser.id },
      });
      console.log(`   ✅ ${deletedGroups.count} grup silindi`);

      console.log('💰 Testuser ödeme talepleri siliniyor...');
      const deletedPaymentRequests = await prisma.paymentRequest.deleteMany({
        where: { userId: testuser.id },
      });
      console.log(`   ✅ ${deletedPaymentRequests.count} ödeme talebi silindi`);

      console.log('💳 Testuser ödemeleri siliniyor...');
      const deletedPayments = await prisma.payment.deleteMany({
        where: { userId: testuser.id },
      });
      console.log(`   ✅ ${deletedPayments.count} ödeme silindi`);

      console.log('🔄 Testuser iadeleri siliniyor...');
      const deletedRefunds = await prisma.refund.deleteMany({
        where: { userId: testuser.id },
      });
      console.log(`   ✅ ${deletedRefunds.count} iade silindi`);

      // Testuser'ın kredi bilgisini sıfırla
      await prisma.user.update({
        where: { id: testuser.id },
        data: { credit: 0 },
      });
      console.log('   ✅ Testuser kredisi sıfırlandı');
    }

    // 3. Admin ve testuser dışındaki tüm kullanıcıları sil
    console.log('\n🗑️  Demo kullanıcılar siliniyor...');
    const usersToDelete = await prisma.user.findMany({
      where: {
        AND: [
          { username: { not: 'admin' } },
          { username: { not: 'testuser' } },
        ],
      },
      select: { id: true, username: true },
    });

    console.log(`   📊 ${usersToDelete.length} kullanıcı silinecek`);

    for (const user of usersToDelete) {
      // Cascade ile tüm ilişkili veriler otomatik silinecek
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`   ✅ ${user.username} silindi`);
    }

    // 4. Özet
    console.log('\n📊 Temizleme Özeti:');
    const remainingUsers = await prisma.user.count();
    console.log(`   👥 Kalan kullanıcı sayısı: ${remainingUsers}`);
    
    const totalSms = await prisma.smsMessage.count();
    console.log(`   📧 Toplam mesaj sayısı: ${totalSms}`);
    
    const totalContacts = await prisma.contact.count();
    console.log(`   👥 Toplam kişi sayısı: ${totalContacts}`);
    
    const totalTemplates = await prisma.smsTemplate.count();
    console.log(`   📋 Toplam şablon sayısı: ${totalTemplates}`);

    console.log('\n✅ Demo veriler başarıyla temizlendi!');
  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDemoData()
  .then(() => {
    console.log('\n✨ İşlem tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 İşlem başarısız:', error);
    process.exit(1);
  });

