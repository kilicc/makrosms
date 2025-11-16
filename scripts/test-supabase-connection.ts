#!/usr/bin/env tsx
/**
 * Supabase Client Bağlantı Testi
 * 
 * Bu script, Supabase client kullanarak veritabanı bağlantısını test eder.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// .env dosyasını yükle
config();

async function testSupabaseConnection() {
  console.log('🔍 Supabase Client bağlantısı test ediliyor...\n');

  // Environment variables kontrolü
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ HATA: SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL bulunamadı!');
    console.log('\n📋 Çözüm:');
    console.log('1. .env dosyasını kontrol edin');
    console.log('2. NEXT_PUBLIC_SUPABASE_URL satırının olduğundan emin olun');
    console.log('3. Format: https://your-project.supabase.co');
    process.exit(1);
  }

  console.log('✅ Supabase URL bulundu');
  console.log(`   URL: ${supabaseUrl}\n`);

  // Service key ile client oluştur (admin yetkileri - RLS bypass)
  if (!supabaseServiceKey) {
    console.warn('⚠️  UYARI: SUPABASE_SERVICE_KEY bulunamadı, anon key kullanılacak');
    console.log('   (Service key olmadan bazı işlemler sınırlı olabilir)\n');
  }

  const key = supabaseServiceKey || supabaseAnonKey;
  
  if (!key) {
    console.error('❌ HATA: SUPABASE_SERVICE_KEY veya NEXT_PUBLIC_SUPABASE_ANON_KEY bulunamadı!');
    console.log('\n📋 Çözüm:');
    console.log('1. .env dosyasını kontrol edin');
    console.log('2. SUPABASE_SERVICE_KEY veya NEXT_PUBLIC_SUPABASE_ANON_KEY ekleyin');
    process.exit(1);
  }

  console.log(`✅ ${supabaseServiceKey ? 'Service Key' : 'Anon Key'} bulundu`);
  console.log(`   Key: ${key.substring(0, 20)}...\n`);

  // Supabase client oluştur
  const supabase = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('🔌 Supabase\'e bağlanılıyor...');
    
    // Basit bir query ile bağlantıyı test et
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      // Tablo yoksa bu normal, bağlantı çalışıyor demektir
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('✅ Bağlantı başarılı! (Tablo henüz oluşturulmamış)\n');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Bağlantı başarılı!\n');
    }
    
    // Tabloları kontrol et
    console.log('📊 Tablolar kontrol ediliyor...');
    let tables, tablesError;
    try {
      const result = await supabase.rpc('get_tables', {});
      tables = result.data;
      tablesError = result.error;
    } catch {
      // RPC function yoksa, alternatif yöntem dene
      tables = null;
      tablesError = null;
    }

    if (tablesError || !tables) {
      // Alternatif: information_schema'dan tabloları al
      let tablesData, tablesErr;
      try {
        const result = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        tablesData = result.data;
        tablesErr = result.error;
      } catch {
        tablesData = null;
        tablesErr = null;
      }

      if (tablesData && tablesData.length > 0) {
        console.log(`✅ ${tablesData.length} tablo bulundu:\n`);
        tablesData.forEach((table: any) => {
          console.log(`   - ${table.table_name}`);
        });
      } else {
        console.log('⚠️  UYARI: Henüz hiç tablo oluşturulmamış!');
        console.log('\n📋 Çözüm:');
        console.log('1. Supabase Dashboard > SQL Editor\'e gidin');
        console.log('2. supabase_full_schema.sql dosyasını çalıştırın');
        console.log('3. Veya: npm run setup:supabase');
      }
    } else {
      console.log(`✅ ${tables.length} tablo bulundu`);
    }

    // users tablosunu özel kontrol et
    console.log('\n🔍 Users tablosu kontrol ediliyor...');
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      if (usersError.code === '42P01' || usersError.message.includes('does not exist')) {
        console.log('⚠️  Users tablosu henüz oluşturulmamış');
      } else {
        console.log(`⚠️  Users tablosu hatası: ${usersError.message}`);
      }
    } else {
      console.log('✅ Users tablosu mevcut');
    }
    
    console.log('\n✅ Supabase Client bağlantı testi tamamlandı!');
    console.log('\n📋 Sonraki adımlar:');
    console.log('1. Tabloları oluşturmak için: npm run setup:supabase');
    console.log('2. Veya Supabase Dashboard > SQL Editor\'den supabase_full_schema.sql çalıştırın');
    
  } catch (error: any) {
    console.error('\n❌ Bağlantı hatası!\n');
    
    if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
      console.error('HATA: JWT/API Key geçersiz');
      console.log('\n📋 Çözüm:');
      console.log('1. Supabase Dashboard > Settings > API');
      console.log('2. service_role key veya anon key\'i kopyalayın');
      console.log('3. .env dosyasındaki SUPABASE_SERVICE_KEY veya NEXT_PUBLIC_SUPABASE_ANON_KEY\'i güncelleyin');
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
      console.error('HATA: Supabase URL\'e ulaşılamıyor');
      console.log('\n📋 Çözüm:');
      console.log('1. NEXT_PUBLIC_SUPABASE_URL\'i kontrol edin');
      console.log('2. İnternet bağlantınızı kontrol edin');
      console.log('3. Supabase projesinin aktif olduğundan emin olun');
    } else {
      console.error('HATA:', error.message);
      console.error('Kod:', error.code || 'Bilinmeyen');
    }
    
    process.exit(1);
  }
}

// Script'i çalıştır
testSupabaseConnection().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

