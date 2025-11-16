#!/usr/bin/env tsx
/**
 * Supabase Tablolarını Oluşturma Scripti (Supabase Client ile)
 * 
 * Bu script, Supabase client kullanarak tabloları oluşturur.
 * Ancak Supabase client direkt SQL çalıştıramaz, bu yüzden SQL dosyasını hazırlar.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// .env dosyasını yükle
config();

async function createSupabaseTables() {
  console.log('🚀 Supabase Client ile tablo oluşturma kontrolü...\n');

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
    console.log('✅ Supabase\'e bağlanıldı\n');

    // Önce mevcut tabloları kontrol et
    console.log('🔍 Mevcut tablolar kontrol ediliyor...');
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (!usersError) {
        console.log('✅ Users tablosu zaten mevcut!');
        console.log('\n📋 Tablolar oluşturulmuş görünüyor.');
        console.log('   Tüm tabloları kontrol etmek için: npm run test:supabase\n');
        return;
      }
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('not found in the schema cache')) {
        console.log('ℹ️  Users tablosu henüz oluşturulmamış.\n');
      } else {
        throw error;
      }
    }

    // SQL dosyasını oku
    const sqlPath = join(process.cwd(), 'supabase_full_schema.sql');
    let sqlContent: string;

    try {
      sqlContent = readFileSync(sqlPath, 'utf-8');
      console.log('✅ SQL dosyası okundu: supabase_full_schema.sql\n');
    } catch (error) {
      console.error('❌ HATA: supabase_full_schema.sql dosyası bulunamadı!');
      process.exit(1);
    }

    console.log('⚠️  ÖNEMLİ: Supabase JavaScript client direkt SQL çalıştıramaz.\n');
    console.log('📋 MANUEL KURULUM GEREKLİ:\n');
    console.log('1. Supabase Dashboard > SQL Editor\'e gidin');
    console.log('   https://supabase.com/dashboard/project/cuvvmpbenpnchikkxevz/sql\n');
    console.log('2. Aşağıdaki SQL dosyasını açın:');
    console.log(`   ${sqlPath}\n`);
    console.log('3. SQL dosyasının TÜM içeriğini kopyalayın');
    console.log('4. SQL Editor\'e yapıştırın');
    console.log('5. "Run" veya "Ctrl+Enter" ile çalıştırın\n');
    console.log('✅ Bu işlem tüm tabloları, index\'leri ve RLS policy\'lerini oluşturacaktır.\n');

    // SQL dosyasını konsola yazdır (ilk 50 satır)
    const sqlLines = sqlContent.split('\n');
    console.log('📄 SQL Dosyası Önizleme (ilk 20 satır):\n');
    sqlLines.slice(0, 20).forEach((line, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}: ${line}`);
    });
    console.log(`\n... (toplam ${sqlLines.length} satır)\n`);

    console.log('💡 İpucu: SQL dosyasını açmak için:');
    console.log(`   cat ${sqlPath} | pbcopy  # macOS'ta kopyalama`);
    console.log(`   veya direkt dosyayı açın: ${sqlPath}\n`);

    // Alternatif: Tabloları tek tek kontrol et
    console.log('🔍 Tablolar oluşturulduktan sonra kontrol etmek için:');
    console.log('   npm run test:supabase\n');

  } catch (error: any) {
    console.error('\n❌ Hata!\n');
    console.error('HATA:', error.message);
    console.error('Kod:', error.code || 'Bilinmeyen');
    
    process.exit(1);
  }
}

// Script'i çalıştır
createSupabaseTables().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

