# Admin Kullanıcı Oluşturma

## Bilgiler
- **Username:** `admin`
- **Email:** `admin@makrosms.com`
- **Password:** `123`
- **Role:** `admin`
- **Credit:** `1000`

## Yöntem 1: SQL ile (Önerilen - Supabase SQL Editor)

1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. Projeni seç
3. SQL Editor'a tıkla
4. Aşağıdaki SQL kodunu çalıştır:

```sql
-- Admin kullanıcıyı oluştur (Şifre: 123)
INSERT INTO users (username, email, password_hash, role, credit, is_verified, created_at, updated_at)
VALUES (
  'admin',
  'admin@makrosms.com',
  '$2a$12$rijMQCxh8rMtECq3Tm4Amuorz4Yp25XaZ7SAOxHybBYgTewgxW/CG',
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
```

**Not:** Eğer `users` tablosu yoksa, önce `supabase_full_schema.sql` dosyasını çalıştır.

## Yöntem 2: Prisma Script ile

1. `.env` dosyasında `DATABASE_URL`'yi düzgün şekilde ayarla:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.cuvvmpbenpnchikkxevz.supabase.co:5432/postgres?schema=public
```

2. Script'i çalıştır:
```bash
cd ~/Desktop/makrosms
npx tsx scripts/create-admin-user.ts
```

## Yöntem 3: Register Sayfası ile (Eğer aktifse)

Eğer register sayfası aktifse, normal bir kullanıcı oluşturup sonra SQL ile admin yapabilirsin:

```sql
UPDATE users 
SET role = 'admin', credit = 1000 
WHERE username = 'your_username';
```

## Giriş Yap

1. Tarayıcıda `http://localhost:3000/login` veya `https://makrosms.com/login` aç
2. **Username/Email:** `admin`
3. **Password:** `123`
4. Giriş yap!

## Sorun Giderme

### "Kullanıcı adı veya şifre hatalı" hatası alıyorsan:
- Veritabanı tablolarının oluşturulduğundan emin ol (`supabase_full_schema.sql`)
- SQL'in başarıyla çalıştırıldığını kontrol et
- Veritabanı bağlantısını kontrol et (`.env` dosyasındaki `DATABASE_URL`)

### Veritabanı bağlantı hatası alıyorsan:
- `.env` dosyasındaki `DATABASE_URL`'yi Supabase dashboard'dan al
- Şifrede özel karakterler varsa URL encode et (örn: `@` → `%40`)

