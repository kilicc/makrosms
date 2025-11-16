#!/usr/bin/env tsx
/**
 * DATABASE_URL URL Encode Düzeltme Scripti
 * 
 * Bu script, DATABASE_URL'deki şifredeki özel karakterleri URL encode eder.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// URL encode helper
function urlEncodePassword(password: string): string {
  // Önce URL decode et (çift encode önlemek için)
  let decoded: string;
  try {
    decoded = decodeURIComponent(password);
  } catch {
    // Decode edilemiyorsa orijinal şifreyi kullan
    decoded = password;
  }
  
  // Şimdi encode et
  return decoded
    .replace(/%/g, '%25')  // % önce encode edilmeli
    .replace(/!/g, '%21')
    .replace(/@/g, '%40')
    .replace(/#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/&/g, '%26')
    .replace(/\+/g, '%2B')
    .replace(/\//g, '%2F')
    .replace(/=/g, '%3D')
    .replace(/\?/g, '%3F');
}

// DATABASE_URL parse helper
function parseDatabaseUrl(url: string): { protocol: string; user: string; password: string; host: string; port: string; database: string; params?: string } | null {
  try {
    const match = url.match(/^(postgresql:\/\/)([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.+)?$/);
    if (!match) return null;

    return {
      protocol: match[1],
      user: match[2],
      password: match[3],
      host: match[4],
      port: match[5],
      database: match[6],
      params: match[7],
    };
  } catch {
    return null;
  }
}

// DATABASE_URL build helper
function buildDatabaseUrl(parsed: { protocol: string; user: string; password: string; host: string; port: string; database: string; params?: string }): string {
  const { protocol, user, password, host, port, database, params } = parsed;
  return `${protocol}${user}:${password}@${host}:${port}/${database}${params || ''}`;
}

async function fixDatabaseUrl() {
  console.log('🔧 DATABASE_URL düzeltiliyor...\n');

  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    console.error('❌ HATA: .env dosyası bulunamadı!');
    console.log('\n📋 Çözüm:');
    console.log('1. Proje kök dizininde .env dosyası oluşturun');
    console.log('2. DATABASE_URL satırını ekleyin');
    process.exit(1);
  }

  // .env dosyasını oku
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');

  let databaseUrlLineIndex = -1;
  let databaseUrlLine = '';

  // DATABASE_URL satırını bul
  for (let i = 0; i < envLines.length; i++) {
    const line = envLines[i].trim();
    if (line.startsWith('DATABASE_URL=') && !line.startsWith('#')) {
      databaseUrlLineIndex = i;
      databaseUrlLine = line.substring('DATABASE_URL='.length);
      break;
    }
  }

  if (databaseUrlLineIndex === -1) {
    console.error('❌ HATA: .env dosyasında DATABASE_URL bulunamadı!');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL bulundu');
  console.log(`   Orijinal: ${databaseUrlLine.substring(0, 50)}...\n`);

  // DATABASE_URL'i parse et
  const parsed = parseDatabaseUrl(databaseUrlLine);

  if (!parsed) {
    console.error('❌ HATA: DATABASE_URL formatı geçersiz!');
    console.log('   Format: postgresql://user:password@host:port/database');
    process.exit(1);
  }

  // Şifreyi URL encode et
  const originalPassword = parsed.password;
  const encodedPassword = urlEncodePassword(originalPassword);

  if (originalPassword === encodedPassword) {
    console.log('ℹ️  Şifrede URL encode gerektiren karakter bulunamadı');
    console.log('   Bağlantı sorunu başka bir nedenle olabilir\n');
    
    console.log('📋 Diğer olası nedenler:');
    console.log('1. Supabase projesi paused durumda olabilir');
    console.log('2. Şifre yanlış olabilir');
    console.log('3. Network bağlantı sorunu olabilir');
    console.log('4. IP whitelist sorunu olabilir\n');
    
    console.log('🔍 Kontrol listesi:');
    console.log('1. Supabase Dashboard > Proje durumu (paused değil)');
    console.log('2. Settings > Database > Connection string (yeni şifre ile)');
    console.log('3. Network bağlantısı');
    
    return;
  }

  console.log(`📝 Şifre URL encode ediliyor:`);
  console.log(`   Orijinal: ${originalPassword}`);
  console.log(`   Encoded:  ${encodedPassword}\n`);

  // Yeni DATABASE_URL oluştur
  const fixedParsed = { ...parsed, password: encodedPassword };
  const fixedDatabaseUrl = buildDatabaseUrl(fixedParsed);

  // .env dosyasını güncelle
  envLines[databaseUrlLineIndex] = `DATABASE_URL=${fixedDatabaseUrl}`;

  // Dosyayı kaydet
  writeFileSync(envPath, envLines.join('\n'), 'utf-8');

  console.log('✅ DATABASE_URL güncellendi!');
  console.log(`   Yeni: ${fixedDatabaseUrl.substring(0, 60)}...\n`);

  console.log('🔍 Bağlantıyı test etmek için:');
  console.log('   npm run test:db\n');
}

// Script'i çalıştır
fixDatabaseUrl().catch((error) => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});

