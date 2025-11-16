#!/usr/bin/env tsx
/**
 * Supabase Tablolarını Oluşturma Scripti
 * 
 * Bu script, Supabase client kullanarak SQL ile tabloları oluşturur.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// .env dosyasını yükle
config();

async function setupSupabaseTables() {
  console.log('🚀 Supabase tabloları oluşturuluyor...\n');

  // Environment variables kontrolü
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    console.error('❌ HATA: SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL bulunamadı!');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ HATA: SUPABASE_SERVICE_KEY bulunamadı!');
    console.log('\n📋 Service Key Nasıl Bulunur:');
    console.log('1. Supabase Dashboard > Settings > API');
    console.log('2. service_role key\'i kopyalayın (secret key)');
    console.log('3. .env dosyasına SUPABASE_SERVICE_KEY olarak ekleyin');
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

    // SQL dosyasını oku
    const sqlPath = join(process.cwd(), 'supabase_full_schema.sql');
    let sqlContent: string;

    try {
      sqlContent = readFileSync(sqlPath, 'utf-8');
      console.log('✅ SQL dosyası okundu: supabase_full_schema.sql\n');
    } catch (error) {
      console.error('❌ HATA: supabase_full_schema.sql dosyası bulunamadı!');
      console.log('\n📋 Çözüm:');
      console.log('1. Proje kök dizininde supabase_full_schema.sql dosyasının olduğundan emin olun');
      process.exit(1);
    }

    // SQL'i statement'lara böl (her ; karakterinden sonra)
    // Not: Supabase'de tek seferde tüm SQL çalıştırılamayabilir, parçalara bölmek gerekebilir
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 ${statements.length} SQL statement bulundu\n`);

    // Önemli statement'ları grupla
    const createTableStatements: string[] = [];
    const createIndexStatements: string[] = [];
    const createPolicyStatements: string[] = [];
    const insertStatements: string[] = [];

    statements.forEach((stmt) => {
      const upperStmt = stmt.toUpperCase();
      if (upperStmt.startsWith('CREATE TABLE')) {
        createTableStatements.push(stmt);
      } else if (upperStmt.startsWith('CREATE INDEX')) {
        createIndexStatements.push(stmt);
      } else if (upperStmt.startsWith('CREATE POLICY') || upperStmt.startsWith('ALTER TABLE') && upperStmt.includes('ENABLE ROW LEVEL SECURITY')) {
        createPolicyStatements.push(stmt);
      } else if (upperStmt.startsWith('INSERT')) {
        insertStatements.push(stmt);
      }
    });

    console.log(`📊 Statement grupları:`);
    console.log(`   - CREATE TABLE: ${createTableStatements.length}`);
    console.log(`   - CREATE INDEX: ${createIndexStatements.length}`);
    console.log(`   - CREATE POLICY: ${createPolicyStatements.length}`);
    console.log(`   - INSERT: ${insertStatements.length}\n`);

    // Tabloları oluştur
    console.log('📦 Tablolar oluşturuluyor...');
    for (let i = 0; i < createTableStatements.length; i++) {
      const stmt = createTableStatements[i];
      try {
        // Tablo adını çıkar (basit regex)
        const tableMatch = stmt.match(/CREATE TABLE (?:IF NOT EXISTS )?([a-z_]+)/i);
        const tableName = tableMatch ? tableMatch[1] : `table_${i + 1}`;

        let error;
        try {
          const result = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
          error = result.error;
        } catch (rpcError: any) {
          // RPC function yoksa, direkt SQL query dene (Supabase PostgREST'te mümkün değil)
          // Alternatif: pg_statements extension kullan
          error = { message: 'RPC function not available' };
        }

        if (error) {
          // Alternatif: Supabase Management API kullan veya kullanıcıyı SQL Editor'e yönlendir
          console.log(`   ⚠️  ${tableName}: RPC ile oluşturulamadı (normal)`);
        } else {
          console.log(`   ✅ ${tableName}`);
        }
      } catch (error: any) {
        console.log(`   ⚠️  Tablo ${i + 1}: ${error.message}`);
      }
    }

    console.log('\n⚠️  ÖNEMLİ: Supabase Client ile direkt SQL çalıştırma sınırlıdır.');
    console.log('📋 MANUEL KURULUM GEREKLİ:\n');
    console.log('1. Supabase Dashboard > SQL Editor\'e gidin');
    console.log('2. supabase_full_schema.sql dosyasının içeriğini kopyalayın');
    console.log('3. SQL Editor\'e yapıştırın ve Run butonuna tıklayın');
    console.log('\n✅ Bu işlem tüm tabloları, index\'leri ve RLS policy\'lerini oluşturacaktır.\n');

    // Alternatif: Kullanıcıya SQL dosyasının yolunu göster
    console.log('📄 SQL dosyası yolu:');
    console.log(`   ${sqlPath}\n`);

  } catch (error: any) {
    console.error('\n❌ Hata!\n');
    console.error('HATA:', error.message);
    console.error('Kod:', error.code || 'Bilinmeyen');
    
    console.log('\n📋 Çözüm:');
    console.log('Manuel olarak Supabase Dashboard > SQL Editor\'den supabase_full_schema.sql dosyasını çalıştırın.');
    
    process.exit(1);
  }
}

// Script'i çalıştır
setupSupabaseTables().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

