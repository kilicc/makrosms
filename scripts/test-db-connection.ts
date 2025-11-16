#!/usr/bin/env tsx
/**
 * Supabase Veritabanı Bağlantı Testi
 * 
 * Bu script, DATABASE_URL'in doğru yapılandırıldığını kontrol eder.
 */

import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('🔍 Veritabanı bağlantısı test ediliyor...\n');

  // DATABASE_URL kontrolü
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ HATA: DATABASE_URL environment variable bulunamadı!');
    console.log('\n📋 Çözüm:');
    console.log('1. .env dosyasını kontrol edin');
    console.log('2. DATABASE_URL satırının olduğundan emin olun');
    console.log('3. Format: postgresql://postgres:[ŞİFRE]@db.[PROJECT-REF].supabase.co:5432/postgres');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL bulundu');
  console.log(`   Format: ${databaseUrl.substring(0, 50)}...\n`);

  // DATABASE_URL format kontrolü
  if (!databaseUrl.startsWith('postgresql://')) {
    console.error('❌ HATA: DATABASE_URL formatı yanlış!');
    console.log('   postgresql:// ile başlamalı');
    process.exit(1);
  }

  // Prisma Client ile bağlantı testi
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('🔌 Veritabanına bağlanılıyor...');
    
    // Basit bir query ile bağlantıyı test et
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Bağlantı başarılı!\n');
    
    // Tabloları kontrol et
    console.log('📊 Tablolar kontrol ediliyor...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  UYARI: Henüz hiç tablo oluşturulmamış!');
      console.log('\n📋 Çözüm:');
      console.log('1. Supabase Dashboard > SQL Editor\'e gidin');
      console.log('2. supabase_full_schema.sql dosyasını çalıştırın');
      console.log('3. Tablolar oluşturulduktan sonra tekrar test edin');
    } else {
      console.log(`✅ ${tables.length} tablo bulundu:\n`);
      tables.forEach((table) => {
        console.log(`   - ${table.tablename}`);
      });
    }
    
    console.log('\n✅ Veritabanı bağlantısı ve tablolar hazır!');
    
  } catch (error: any) {
    console.error('\n❌ Bağlantı hatası!\n');
    
    if (error.code === 'P1001') {
      console.error('HATA: Veritabanı sunucusuna ulaşılamıyor');
      console.log('\n📋 Olası nedenler:');
      console.log('1. DATABASE_URL yanlış yapılandırılmış');
      console.log('2. Supabase projesi durdurulmuş olabilir');
      console.log('3. Şifre yanlış');
      console.log('4. Network bağlantı sorunu');
      console.log('\n📋 Çözüm adımları:');
      console.log('1. Supabase Dashboard\'a gidin');
      console.log('2. Settings > Database > Connection string bölümüne gidin');
      console.log('3. URI formatını seçin ve kopyalayın');
      console.log('4. [YOUR-PASSWORD] kısmını gerçek şifrenizle değiştirin');
      console.log('5. .env dosyasındaki DATABASE_URL\'i güncelleyin');
    } else if (error.code === 'P1000') {
      console.error('HATA: Kimlik doğrulama başarısız');
      console.log('\n📋 Olası nedenler:');
      console.log('1. Şifre yanlış');
      console.log('2. Kullanıcı adı yanlış');
      console.log('\n📋 Çözüm:');
      console.log('1. Supabase Dashboard > Settings > Database > Reset database password');
      console.log('2. Yeni şifre ile DATABASE_URL\'i güncelleyin');
      console.log('3. Şifrede özel karakterler varsa URL encode edin');
    } else {
      console.error('HATA:', error.message);
      console.error('Kod:', error.code);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
testConnection().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

