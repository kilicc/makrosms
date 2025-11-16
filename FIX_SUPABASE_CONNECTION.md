# 🔧 Supabase Bağlantı Sorunu Düzeltme Rehberi

## ❌ Hata
```
Error: P1001: Can't reach database server at `db.cuvvmpbenpnchikkxevz.supabase.co:5432`
```

## 🔍 Sorun Analizi

Bu hata, Prisma'nın Supabase veritabanına bağlanamadığını gösterir. Olası nedenler:

1. **DATABASE_URL yanlış yapılandırılmış**
2. **Supabase projesi durdurulmuş**
3. **Şifre yanlış veya URL encode edilmemiş**
4. **Network bağlantı sorunu**

## ✅ Çözüm Adımları

### 1. Bağlantıyı Test Edin

```bash
npx tsx scripts/test-db-connection.ts
```

Bu script size detaylı hata mesajı ve çözüm önerileri verecektir.

### 2. Supabase Projesini Kontrol Edin

1. **Supabase Dashboard**'a gidin: https://supabase.com/dashboard
2. Projenizin **aktif** olduğundan emin olun (paused durumda olmamalı)
3. Eğer paused durumdaysa, **Resume** butonuna tıklayın

### 3. DATABASE_URL'i Kontrol Edin

#### .env Dosyasını Açın

`.env` dosyasında `DATABASE_URL` satırını bulun:

```env
DATABASE_URL=postgresql://postgres:[ŞİFRE]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### Supabase'den Doğru Connection String'i Alın

**Yöntem 1: Direct Connection (Basit)**

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection string** bölümüne gidin
3. **URI** formatını seçin
4. Connection string'i kopyalayın
5. `[YOUR-PASSWORD]` kısmını **gerçek şifrenizle** değiştirin

**Format:**
```
postgresql://postgres:[ŞİFRE]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Yöntem 2: Connection Pooling (Alternatif - Daha İyi)**

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection Pooling** bölümüne gidin
3. **Transaction mode** seçin
4. **URI** formatını kopyalayın
5. `[YOUR-PASSWORD]` kısmını **gerçek şifrenizle** değiştirin

**Format:**
```
postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 4. Şifre URL Encode Etme

Eğer şifrenizde özel karakterler varsa, bunları URL encode etmeniz gerekir:

| Karakter | URL Encoded |
|----------|-------------|
| `!` | `%21` |
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `/` | `%2F` |
| `=` | `%3D` |
| `?` | `%3F` |

**Örnek:**
```
Şifre: MyP@ssw0rd#123
URL Encoded: MyP%40ssw0rd%23123
```

### 5. .env Dosyasını Güncelleyin

```env
# Direct Connection
DATABASE_URL=postgresql://postgres:MyP%40ssw0rd%23123@db.abcdefghijklmnop.supabase.co:5432/postgres

# Veya Connection Pooling (Önerilen)
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MyP%40ssw0rd%23123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 6. Bağlantıyı Tekrar Test Edin

```bash
npx tsx scripts/test-db-connection.ts
```

### 7. Prisma ile Test Edin

```bash
npx prisma db pull
```

Eğer başarılı olursa, veritabanı bağlantısı çalışıyor demektir.

## 🔐 Şifreyi Sıfırlama

Eğer şifreyi unuttuysanız veya bağlantı hala çalışmıyorsa:

1. Supabase Dashboard → **Settings** → **Database**
2. **Database password** bölümüne gidin
3. **Reset database password** butonuna tıklayın
4. Yeni şifreyi kopyalayın (sadece bir kez gösterilir!)
5. `.env` dosyasındaki `DATABASE_URL`'deki şifreyi güncelleyin
6. Özel karakterler varsa URL encode edin

## 🌐 Network Sorunları

Eğer network bağlantı sorunları yaşıyorsanız:

1. **VPN** kullanıyorsanız kapatın ve tekrar deneyin
2. **Firewall** ayarlarını kontrol edin
3. **İnternet bağlantınızı** kontrol edin
4. Supabase **Status** sayfasını kontrol edin: https://status.supabase.com/

## 📊 Hızlı Kontrol Listesi

- [ ] Supabase projesi aktif (paused değil)
- [ ] `.env` dosyasında `DATABASE_URL` var
- [ ] `DATABASE_URL` formatı doğru (`postgresql://` ile başlıyor)
- [ ] Şifre doğru girilmiş
- [ ] Şifredeki özel karakterler URL encode edilmiş
- [ ] Network bağlantısı çalışıyor
- [ ] `npx tsx scripts/test-db-connection.ts` başarılı

## 🆘 Hala Çalışmıyor mu?

1. **Supabase Support** ile iletişime geçin
2. **Discord** topluluğuna sorun: https://discord.supabase.com
3. **GitHub Issues** kontrol edin: https://github.com/supabase/supabase/issues

## 📝 Örnek .env Dosyası

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (Direct Connection)
DATABASE_URL=postgresql://postgres:your_password_here@db.abcdefghijklmnop.supabase.co:5432/postgres

# Database (Connection Pooling - Önerilen)
# DATABASE_URL=postgresql://postgres.abcdefghijklmnop:your_password_here@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# CepSMS
CEPSMS_USERNAME=Testfn
CEPSMS_PASSWORD=Qaswed
CEPSMS_FROM=CepSMS
```

## ✅ Başarı Kontrolü

Bağlantı başarılı olduğunda göreceğiniz çıktı:

```
✅ DATABASE_URL bulundu
✅ Bağlantı başarılı!
✅ 13 tablo bulundu:
   - api_keys
   - contact_groups
   - contacts
   - crypto_currencies
   - payment_packages
   - payment_requests
   - payments
   - refunds
   - short_link_clicks
   - short_links
   - sms_messages
   - sms_templates
   - users
```

