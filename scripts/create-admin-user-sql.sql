-- Admin kullanıcı oluştur (şifre: 123)
-- Bu SQL'i Supabase SQL Editor'da çalıştır

-- Önce users tablosunun var olduğundan emin ol
-- Eğer tablo yoksa önce supabase_full_schema.sql'i çalıştır

-- Admin kullanıcıyı oluştur (Şifre: 123)
INSERT INTO users (username, email, password_hash, role, credit, is_verified, created_at, updated_at)
VALUES (
  'admin',
  'admin@makrosms.com',
  '$2a$12$rijMQCxh8rMtECq3Tm4Amuorz4Yp25XaZ7SAOxHybBYgTewgxW/CG', -- Şifre: 123 (bcrypt hash)
  'admin',
  1000,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE 
SET 
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  credit = 1000,
  is_verified = true,
  updated_at = NOW();

-- Kullanıcı bilgileri:
-- Username: admin
-- Email: admin@makrosms.com
-- Password: 123
-- Role: admin
-- Credit: 1000

