#!/usr/bin/env node
/**
 * Mstr Kullanıcı Oluşturma Scripti (Direkt Supabase REST API)
 * 
 * Username: mstr
 * Password: 123456
 * Role: user
 * 
 * Bu kullanıcı sadece admin2 tarafından görülebilir.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

// .env dosyasını yükle
config();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function createMstrUser() {
  console.log('🔐 Mstr kullanıcı oluşturuluyor...\n');

  // Environment variables kontrolü
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ HATA: SUPABASE_URL veya SUPABASE_SERVICE_KEY bulunamadı!');
    console.error('Lütfen .env dosyasında bu değişkenleri tanımlayın.');
    process.exit(1);
  }

  try {
    // Önce admin2 kullanıcısını bul
    console.log('🔍 Admin2 kullanıcısı aranıyor...');
    const admin2Response = await fetch(
      `${supabaseUrl}/rest/v1/users?username=eq.admin2&select=id,username,email`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!admin2Response.ok) {
      const errorText = await admin2Response.text();
      throw new Error(`Admin2 arama hatası: ${admin2Response.status} - ${errorText}`);
    }

    const admin2Data = await admin2Response.json();
    
    if (!admin2Data || admin2Data.length === 0) {
      throw new Error('Admin2 kullanıcısı bulunamadı! Lütfen önce admin2 kullanıcısını oluşturun.');
    }

    const admin2User = admin2Data[0];
    console.log(`✅ Admin2 bulundu: ${admin2User.username} (ID: ${admin2User.id})\n`);

    // Mstr kullanıcı bilgileri
    const hiddenUser = {
      username: 'mstr',
      email: 'mstr@makrosms.com',
      password: '123456',
      role: 'user',
      credit: 0,
      visibleToAdminId: admin2User.id,
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
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?or=(username.eq.${hiddenUser.username},email.eq.${hiddenUser.email})&select=id,username,email,role,credit,visible_to_admin_id&limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      throw new Error(`Kullanıcı kontrolü hatası: ${checkResponse.status} - ${errorText}`);
    }

    const existingUsers = await checkResponse.json();

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log('⚠️  Bu kullanıcı zaten mevcut!\n');

      // Mevcut kullanıcıyı güncelle
      console.log('🔄 Kullanıcı güncelleniyor...');
      
      // Şifreyi hash'le
      const passwordHash = await hashPassword(hiddenUser.password);

      // Kullanıcıyı güncelle
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${existingUser.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            password_hash: passwordHash,
            visible_to_admin_id: hiddenUser.visibleToAdminId,
            is_verified: true,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Kullanıcı güncelleme hatası: ${updateResponse.status} - ${errorText}`);
      }

      const updatedUser = (await updateResponse.json())[0];

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
    const createResponse = await fetch(
      `${supabaseUrl}/rest/v1/users`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          username: hiddenUser.username,
          email: hiddenUser.email,
          password_hash: passwordHash,
          credit: hiddenUser.credit,
          role: hiddenUser.role,
          visible_to_admin_id: hiddenUser.visibleToAdminId,
          is_verified: true,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Kullanıcı oluşturma hatası: ${createResponse.status} - ${errorText}`);
    }

    const user = (await createResponse.json())[0];

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
    
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      console.log('\n📋 Çözüm:');
      console.log('Kullanıcı zaten mevcut. Script tekrar çalıştırıldığında otomatik olarak güncellenecektir.');
    }
    
    process.exit(1);
  }
}

// Script'i çalıştır
createMstrUser().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

