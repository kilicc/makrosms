#!/usr/bin/env tsx
/**
 * Gizli Kullanıcı Oluşturma Scripti
 * 
 * Username: mstr
 * Password: 123456
 * Role: user
 * 
 * Bu kullanıcı sadece admin2 tarafından görülebilir.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../lib/utils/password';

// .env dosyasını yükle
config();

async function createHiddenUser() {
  console.log('🔐 Gizli kullanıcı (mstr) oluşturuluyor...\n');

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
    console.log('⚠️  ÖNEMLİ: Eğer "visible_to_admin_id" kolonu yoksa, önce SQL migration script\'ini çalıştırın:');
    console.log('   scripts/add_visible_to_admin_column.sql\n');

    // Önce admin2 kullanıcısını bul
    console.log('🔍 Admin2 kullanıcısı aranıyor...');
    const { data: admin2User, error: admin2Error } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('username', 'admin2')
      .single();

    if (admin2Error || !admin2User) {
      throw new Error('Admin2 kullanıcısı bulunamadı! Lütfen önce admin2 kullanıcısını oluşturun.');
    }

    console.log(`✅ Admin2 bulundu: ${admin2User.username} (ID: ${admin2User.id})\n`);

    // Mstr kullanıcı bilgileri
    const hiddenUser = {
      username: 'mstr',
      email: 'mstr@makrosms.com',
      password: '123456',
      role: 'user',
      credit: 0,
      visibleToAdminId: admin2User.id, // Sadece admin2 görebilir
    };

    console.log('📋 Mstr Kullanıcı Bilgileri:');
    console.log(`   Username: ${hiddenUser.username}`);
    console.log(`   Email: ${hiddenUser.email}`);
    console.log(`   Password: ${hiddenUser.password}`);
    console.log(`   Role: ${hiddenUser.role}`);
    console.log(`   Credit: ${hiddenUser.credit}`);
    console.log(`   Visible To: admin2 (${admin2User.id})\n`);

    // Kullanıcı zaten var mı kontrol et
    console.log('🔍 Mevcut kullanıcı kontrol ediliyor...');
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, username, email, role, credit, visible_to_admin_id')
      .or(`username.eq.${hiddenUser.username},email.eq.${hiddenUser.email}`)
      .limit(1);

    if (checkError) {
      throw new Error(`Kullanıcı kontrolü hatası: ${checkError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log('⚠️  Bu kullanıcı zaten mevcut!\n');

      // Mevcut kullanıcıyı güncelle
      console.log('🔄 Kullanıcı güncelleniyor...');
      
      // Şifreyi hash'le
      const passwordHash = await hashPassword(hiddenUser.password);

      // Kullanıcıyı güncelle
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          visible_to_admin_id: hiddenUser.visibleToAdminId,
          is_verified: true,
        })
        .eq('id', existingUser.id)
        .select('id, username, email, role, credit, visible_to_admin_id, created_at')
        .single();

      if (updateError || !updatedUser) {
        throw new Error(`Kullanıcı güncelleme hatası: ${updateError?.message || 'Bilinmeyen hata'}`);
      }

      console.log('✅ Mevcut kullanıcı güncellendi!\n');
      console.log('📋 Güncellenmiş Mstr Kullanıcı Bilgileri:');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Username: ${updatedUser.username}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Password: ${hiddenUser.password}`);
      console.log(`   Credit: ${updatedUser.credit || 0}`);
      console.log(`   Role: ${updatedUser.role || 'user'}`);
      console.log(`   Visible To Admin ID: ${updatedUser.visible_to_admin_id}`);
      console.log('');
      console.log('🔒 Bu kullanıcı sadece admin2 tarafından görülebilir!');
      return;
    }

    // Şifreyi hash'le
    console.log('🔐 Şifre hashleniyor...');
    const passwordHash = await hashPassword(hiddenUser.password);

    // Mstr kullanıcı oluştur
    console.log('👤 Mstr kullanıcı oluşturuluyor...');
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        username: hiddenUser.username,
        email: hiddenUser.email,
        password_hash: passwordHash,
        credit: hiddenUser.credit,
        role: hiddenUser.role,
        visible_to_admin_id: hiddenUser.visibleToAdminId,
        is_verified: true,
      })
      .select('id, username, email, credit, role, visible_to_admin_id, created_at')
      .single();

    if (createError || !user) {
      throw new Error(`Kullanıcı oluşturma hatası: ${createError?.message || 'Bilinmeyen hata'}`);
    }

    console.log('✅ Mstr kullanıcı başarıyla oluşturuldu!\n');
    console.log('📋 Mstr Kullanıcı Bilgileri:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${hiddenUser.password}`);
    console.log(`   Credit: ${user.credit || 0}`);
    console.log(`   Role: ${user.role || 'user'}`);
    console.log(`   Visible To Admin ID: ${user.visible_to_admin_id}`);
    console.log(`   Created At: ${user.created_at || 'N/A'}`);
    console.log('');
    console.log('🔒 Bu kullanıcı sadece admin2 tarafından görülebilir!');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Mstr kullanıcı oluşturma hatası!\n');
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
createHiddenUser().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

