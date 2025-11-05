import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/utils/password';

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    // Demo kullanıcı bilgileri
    const demoUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123',
    };

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: demoUser.username },
          { email: demoUser.email },
        ],
      },
    });

    if (existingUser) {
      console.log('⚠️  Bu kullanıcı zaten mevcut!');
      console.log(`Username: ${existingUser.username}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Credit: ${existingUser.credit || 0}`);
      console.log('');
      
      // Yeni bir kullanıcı oluşturmayı dene
      const timestamp = Date.now();
      demoUser.username = `testuser${timestamp}`;
      demoUser.email = `test${timestamp}@example.com`;
      console.log(`🔄 Yeni kullanıcı oluşturuluyor: ${demoUser.username}`);
    }

    // Şifreyi hash'le
    const passwordHash = await hashPassword(demoUser.password);

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        username: demoUser.username,
        email: demoUser.email,
        passwordHash,
        credit: 100, // Başlangıç kredisi
        role: 'user',
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

    console.log('');
    console.log('✅ Demo kullanıcı başarıyla oluşturuldu!');
    console.log('');
    console.log('📋 Kullanıcı Bilgileri:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${demoUser.password}`);
    console.log(`   Credit: ${user.credit}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    console.log('🔗 Giriş yapmak için:');
    console.log('   http://localhost:3000/login');
    console.log('');
    console.log('📝 Mevcut Demo Kullanıcılar:');
    
    // Tüm kullanıcıları listele
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        credit: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    
    allUsers.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.username} (${u.email}) - Credit: ${u.credit || 0} - Role: ${u.role || 'user'}`);
    });
  } catch (error: any) {
    console.error('❌ Demo kullanıcı oluşturma hatası:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
