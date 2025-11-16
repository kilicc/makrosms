import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/utils/password';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Admin kullanıcı bilgileri
    const adminUser = {
      username: 'admin',
      email: 'admin@makrosms.com',
      password: '123',
      role: 'admin',
    };

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: adminUser.username },
          { email: adminUser.email },
        ],
      },
    });

    if (existingUser) {
      // Mevcut kullanıcıyı admin yap
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'admin',
          credit: existingUser.credit || 1000,
        },
        select: {
          id: true,
          username: true,
          email: true,
          credit: true,
          role: true,
        },
      });

      console.log('✅ Mevcut kullanıcı admin yapıldı!');
      console.log('');
      console.log('📋 Admin Kullanıcı Bilgileri:');
      console.log(`   Username: ${updatedUser.username}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Credit: ${updatedUser.credit || 0}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log('');
      console.log('🔗 Giriş yapmak için:');
      console.log('   http://localhost:3000/login');
      return;
    }

    // Şifreyi hash'le
    const passwordHash = await hashPassword(adminUser.password);

    // Admin kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        username: adminUser.username,
        email: adminUser.email,
        passwordHash,
        credit: 1000, // Admin için daha fazla kredi
        role: 'admin',
      },
      select: {
        id: true,
        username: true,
        email: true,
        credit: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('✅ Admin kullanıcı başarıyla oluşturuldu!');
    console.log('');
    console.log('📋 Admin Kullanıcı Bilgileri:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${adminUser.password}`);
    console.log(`   Credit: ${user.credit}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    console.log('🔗 Giriş yapmak için:');
    console.log('   http://localhost:3000/login');
    console.log('');
    console.log('🔗 Admin panele erişmek için:');
    console.log('   http://localhost:3000/admin');
  } catch (error: any) {
    console.error('❌ Admin kullanıcı oluşturma hatası:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

