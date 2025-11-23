#!/usr/bin/env tsx
/**
 * Admin2 Kullanıcı Oluşturma Scripti
 * 
 * Username: admin2
 * Password: 123
 * Role: admin
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../lib/utils/password';

// .env dosyasını yükle
config();

async function createAdmin2User() {
  console.log('🔐 Admin2 kullanıcı oluşturuluyor...\n');

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
    // Admin2 kullanıcı bilgileri
    const adminUser = {
      username: 'admin2',
      email: 'admin2@makrosms.com',
      password: '123',
      role: 'admin',
      credit: 10000,
    };

    console.log('📋 Admin2 Kullanıcı Bilgileri:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${adminUser.password}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Credit: ${adminUser.credit}\n`);

    // Kullanıcı zaten var mı kontrol et
    console.log('🔍 Mevcut kullanıcı kontrol ediliyor...');
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, username, email, role, credit')
      .or(`username.eq.${adminUser.username},email.eq.${adminUser.email}`)
      .limit(1);

    if (checkError) {
      throw new Error(`Kullanıcı kontrolü hatası: ${checkError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log('⚠️  Bu kullanıcı zaten mevcut!\n');

      // Mevcut kullanıcıyı admin yap ve şifreyi güncelle
      console.log('🔄 Kullanıcı admin yapılıyor ve şifre güncelleniyor...');
      
      // Şifreyi hash'le
      const passwordHash = await hashPassword(adminUser.password);

      // Kullanıcıyı güncelle
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: adminUser.role,
          credit: existingUser.credit || adminUser.credit,
          is_verified: true,
        })
        .eq('id', existingUser.id)
        .select('id, username, email, role, credit, created_at')
        .single();

      if (updateError || !updatedUser) {
        throw new Error(`Kullanıcı güncelleme hatası: ${updateError?.message || 'Bilinmeyen hata'}`);
      }

      console.log('✅ Mevcut kullanıcı admin yapıldı ve şifre güncellendi!\n');
      console.log('📋 Güncellenmiş Admin2 Kullanıcı Bilgileri:');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Username: ${updatedUser.username}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Password: ${adminUser.password}`);
      console.log(`   Credit: ${updatedUser.credit || 0}`);
      console.log(`   Role: ${updatedUser.role || 'admin'}`);
      console.log('');
      console.log('🔗 Giriş yapmak için:');
      console.log('   http://localhost:3000/login');
      console.log('');
      console.log('🔗 Admin panele erişmek için:');
      console.log('   http://localhost:3000/admin');
      return;
    }

    // Şifreyi hash'le
    console.log('🔐 Şifre hashleniyor...');
    const passwordHash = await hashPassword(adminUser.password);

    // Admin2 kullanıcı oluştur
    console.log('👤 Admin2 kullanıcı oluşturuluyor...');
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        username: adminUser.username,
        email: adminUser.email,
        password_hash: passwordHash,
        credit: adminUser.credit,
        role: adminUser.role,
        is_verified: true,
      })
      .select('id, username, email, credit, role, created_at')
      .single();

    if (createError || !user) {
      throw new Error(`Kullanıcı oluşturma hatası: ${createError?.message || 'Bilinmeyen hata'}`);
    }

    console.log('✅ Admin2 kullanıcı başarıyla oluşturuldu!\n');
    console.log('📋 Admin2 Kullanıcı Bilgileri:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${adminUser.password}`);
    console.log(`   Credit: ${user.credit || 0}`);
    console.log(`   Role: ${user.role || 'admin'}`);
    console.log(`   Created At: ${user.created_at || 'N/A'}`);
    console.log('');
    console.log('🔗 Giriş yapmak için:');
    console.log('   http://localhost:3000/login');
    console.log('');
    console.log('🔗 Admin panele erişmek için:');
    console.log('   http://localhost:3000/admin');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Admin2 kullanıcı oluşturma hatası!\n');
    console.error('HATA:', error.message);
    console.error('Kod:', error.code || 'Bilinmeyen');
    
    if (error.message.includes('duplicate key')) {
      console.log('\n📋 Çözüm:');
      console.log('Kullanıcı zaten mevcut. Script tekrar çalıştırıldığında otomatik olarak güncellenecektir.');
    }
    
    process.exit(1);
  }
}

// Script'i çalıştır
createAdmin2User().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

