#!/usr/bin/env tsx
/**
 * Login Test Scripti
 * 
 * Bu script, login işlemini test eder ve hataları debug eder.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword, hashPassword } from '../lib/utils/password';

// .env dosyasını yükle
config();

async function testLogin() {
  console.log('🔐 Login testi başlatılıyor...\n');

  // Environment variables kontrolü
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ HATA: SUPABASE_URL veya SUPABASE_SERVICE_KEY bulunamadı!');
    process.exit(1);
  }

  // Supabase client oluştur (service key ile - admin yetkileri)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const login = 'admin';
    const password = '123';

    console.log('📋 Test Bilgileri:');
    console.log(`   Login: ${login}`);
    console.log(`   Password: ${password}\n`);

    // 1. Kullanıcıyı bul
    console.log('1️⃣ Kullanıcı aranıyor...');
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${login},email.eq.${login}`)
      .limit(1);

    if (findError) {
      console.error('❌ Kullanıcı arama hatası:', findError);
      console.error('   Mesaj:', findError.message);
      console.error('   Kod:', findError.code);
      console.error('   Detaylar:', findError.details);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.error('❌ Kullanıcı bulunamadı!');
      console.log('\n📋 Çözüm:');
      console.log('   npm run create:admin');
      process.exit(1);
    }

    const user = users[0];
    console.log('✅ Kullanıcı bulundu!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || 'user'}`);
    console.log(`   Password Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}\n`);

    if (!user.password_hash) {
      console.error('❌ HATA: Kullanıcının password_hash alanı boş!');
      console.log('\n📋 Çözüm:');
      console.log('   1. Kullanıcının şifresini reset edin');
      console.log('   2. npm run create:admin ile yeniden oluşturun');
      process.exit(1);
    }

    // 2. Şifre kontrolü
    console.log('2️⃣ Şifre kontrol ediliyor...');
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      console.error('❌ Şifre doğrulama başarısız!');
      console.log('\n📋 Debug Bilgileri:');
      console.log(`   Girilen şifre: ${password}`);
      console.log(`   Hash başlangıcı: ${user.password_hash.substring(0, 30)}...`);
      
      // Test: Yeni hash oluştur ve karşılaştır
      console.log('\n🔍 Test: Yeni hash oluşturuluyor...');
      const testHash = await hashPassword(password);
      console.log(`   Yeni hash: ${testHash.substring(0, 30)}...`);
      console.log(`   Hash eşleşiyor mu: ${testHash === user.password_hash ? 'EVET' : 'HAYIR'}`);
      
      // Hash'leri karşılaştır
      const testCompare = await verifyPassword(password, testHash);
      console.log(`   Yeni hash ile şifre doğrulama: ${testCompare ? 'BAŞARILI' : 'BAŞARISIZ'}`);
      
      console.log('\n📋 Çözüm:');
      console.log('   1. Kullanıcının şifresini güncelleyin');
      console.log('   2. npm run create:admin ile şifreyi reset edin');
      process.exit(1);
    }

    console.log('✅ Şifre doğrulama başarılı!\n');

    // 3. Token oluşturma testi (opsiyonel)
    console.log('3️⃣ Login işlemi simülasyonu başarılı!');
    console.log('\n✅ Tüm testler başarılı!');
    console.log('\n📋 Login Bilgileri:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || 'user'}`);
    console.log(`   Credit: ${user.credit || 0}`);
    console.log('\n🔗 Giriş yapabilirsiniz!');

  } catch (error: any) {
    console.error('\n❌ Beklenmeyen hata!\n');
    console.error('HATA:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Script'i çalıştır
testLogin().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

