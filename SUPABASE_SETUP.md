# Supabase Veritabanı Kurulum Rehberi

Bu rehber, Supabase'de hiçbir tablo oluşturulmamış projeyi tamamlamak için adım adım talimatlar içerir.

## Önkoşullar

1. Supabase projesi oluşturulmuş olmalı
2. `.env` dosyasında `DATABASE_URL` doğru yapılandırılmış olmalı
3. Supabase Dashboard'a erişiminiz olmalı

## Kurulum Adımları

### 1. Supabase SQL Editor'ü Açın

1. Supabase Dashboard'a giriş yapın
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ü açın
4. **New Query** butonuna tıklayın

### 2. SQL Dosyasını Çalıştırın

`supabase_full_schema.sql` dosyasının içeriğini kopyalayın ve SQL Editor'e yapıştırın, ardından **Run** butonuna tıklayın.

Bu dosya şunları yapacak:
- Tüm tabloları oluşturacak
- Index'leri oluşturacak
- Foreign key'leri ayarlayacak
- Varsayılan verileri ekleyecek (payment packages, crypto currencies)
- Row Level Security (RLS) politikalarını ayarlayacak

### 3. Prisma Schema'yı Senkronize Edin

SQL dosyasını çalıştırdıktan sonra, Prisma schema'yı Supabase ile senkronize edin:

```bash
npx prisma db pull
npx prisma generate
npx prisma validate
```

### 4. Doğrulama

Tabloların oluşturulduğunu kontrol edin:

```bash
# Supabase Dashboard > Table Editor'de tüm tabloları görebilmelisiniz:
# - users
# - contact_groups
# - contacts
# - sms_messages
# - sms_templates
# - refunds
# - payments
# - payment_requests
# - payment_packages
# - crypto_currencies
# - short_links
# - short_link_clicks
# - api_keys
```

### 5. İlk Admin Kullanıcıyı Oluşturun

Admin kullanıcı oluşturmak için `scripts/create-admin-user.ts` scriptini çalıştırın:

```bash
npx tsx scripts/create-admin-user.ts
```

Veya SQL ile direkt oluşturabilirsiniz:

```sql
-- Şifreyi bcrypt ile hash'leyin (Node.js ile)
-- Örnek: bcrypt.hashSync('admin123', 10)
-- Sonra SQL Editor'de çalıştırın:

INSERT INTO users (username, email, password_hash, role, credit, is_verified)
VALUES ('admin', 'admin@example.com', '$2a$10$HASHED_PASSWORD_HERE', 'admin', 10000, true);
```

## Sorun Giderme

### Veritabanı Bağlantı Hatası

Eğer `prisma db push` komutu bağlantı hatası veriyorsa:

1. `.env` dosyasındaki `DATABASE_URL`'yi kontrol edin
2. Supabase Dashboard > Settings > Database > Connection String'den doğru connection string'i alın
3. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

### RLS Politikaları Sorunları

Eğer RLS politikaları çalışmıyorsa:

1. Supabase Dashboard > Authentication > Policies'de kontrol edin
2. Her tablo için RLS'nin aktif olduğundan emin olun
3. Politikaların doğru oluşturulduğunu kontrol edin

### Prisma Schema Uyumsuzluğu

Eğer Prisma schema ile veritabanı uyumsuzsa:

```bash
# Supabase'den schema'yı çek
npx prisma db pull

# Prisma Client'ı yeniden oluştur
npx prisma generate

# Schema'yı validate et
npx prisma validate
```

## Sonraki Adımlar

1. ✅ Tüm tablolar oluşturuldu
2. ✅ RLS politikaları ayarlandı
3. ✅ Varsayılan veriler eklendi
4. ⏭️ Admin kullanıcı oluşturuldu
5. ⏭️ Projeyi test edin

## Tablo Yapısı

### Temel Tablolar
- `users` - Kullanıcılar
- `contact_groups` - İletişim grupları
- `contacts` - İletişimler
- `sms_messages` - SMS mesajları
- `sms_templates` - SMS şablonları

### Ödeme Tabloları
- `payments` - Ödemeler
- `payment_requests` - Ödeme talepleri
- `payment_packages` - Ödeme paketleri
- `crypto_currencies` - Kripto para birimleri
- `refunds` - İadeler

### API ve Link Tabloları
- `api_keys` - API anahtarları
- `short_links` - Kısa linkler
- `short_link_clicks` - Kısa link tıklamaları

## Güvenlik Notları

- Tüm tablolarda Row Level Security (RLS) aktif
- Kullanıcılar sadece kendi verilerini görebilir/düzenleyebilir
- Admin kullanıcılar tüm verilere erişebilir
- API key'ler güvenli şekilde saklanır

