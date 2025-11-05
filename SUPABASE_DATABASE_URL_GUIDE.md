# 📍 Supabase DATABASE_URL Nasıl Bulunur?

## Adım Adım Rehber

### 1. Supabase Dashboard'a Giriş Yapın

1. [https://supabase.com](https://supabase.com) adresine gidin
2. **Sign In** butonuna tıklayın
3. Hesabınıza giriş yapın

### 2. Projenizi Seçin

1. Dashboard'da projenizi seçin (veya yeni proje oluşturun)
2. Proje sayfasına gidin

### 3. Database Connection String'i Bulun

**Yöntem 1: Settings Menüsünden (Önerilen)**

1. Sol menüden **Settings** (⚙️) ikonuna tıklayın
2. **Database** sekmesine tıklayın
3. **Connection string** bölümünü bulun
4. **URI** formatını seçin (Session mode veya Transaction mode)
5. Connection string şu formatta olacaktır:

```
postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Yöntem 2: Project Settings'den**

1. Sol menüden **Project Settings** (⚙️) ikonuna tıklayın
2. **Database** sekmesine gidin
3. **Connection string** bölümünde **URI** formatını kopyalayın

**Yöntem 3: Connection Pooling'den**

1. **Settings** > **Database** > **Connection Pooling** bölümüne gidin
2. **Connection string** kısmından **URI** formatını alın

### 4. Connection String Formatları

Supabase'de 3 farklı connection string formatı vardır:

#### Format 1: Direct Connection (Önerilen)
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### Format 2: Session Mode (Connection Pooling)
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### Format 3: Transaction Mode (Connection Pooling)
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### 5. Şifrenizi Bulun

Eğer connection string'de `[YOUR-PASSWORD]` yazıyorsa:

1. **Settings** > **Database** > **Database password** bölümüne gidin
2. Şifrenizi görüntüleyin veya **Reset database password** ile yeni şifre oluşturun
3. Şifrenizi connection string'deki `[YOUR-PASSWORD]` kısmına yazın

**Önemli:** Şifrenizde özel karakterler varsa URL encode edilmelidir:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`
- `=` → `%3D`
- `?` → `%3F`

### 6. .env Dosyasına Ekleyin

`.env` dosyanızı açın ve `DATABASE_URL` satırını bulun:

```env
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

Bu satırı Supabase'den aldığınız connection string ile değiştirin:

```env
DATABASE_URL=postgresql://postgres:[GERÇEK-ŞİFRENİZ]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 7. Örnek Connection String

Eğer:
- **Project REF**: `abcdefghijklmnop`
- **Password**: `MySecurePass123!`
- **Region**: `eu-central-1`

O zaman connection string şöyle olur:

```env
DATABASE_URL=postgresql://postgres:MySecurePass123%21@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Not:** `!` karakteri `%21` olarak encode edilmiştir.

## 🎯 Hızlı Kontrol

DATABASE_URL'i ekledikten sonra:

```bash
# Prisma şemasını Supabase'den çek
npx prisma db pull

# Prisma Client'ı yeniden oluştur
npx prisma generate

# Bağlantıyı test et
npx prisma validate
```

## ❓ Sorun Giderme

### "invalid port number" hatası

Connection string'deki port numarasını kontrol edin:
- Direct connection: `5432`
- Pooled connection: `6543`

### "authentication failed" hatası

1. Şifrenizi kontrol edin
2. Şifrede özel karakterler varsa URL encode edin
3. Database password'ü reset edip tekrar deneyin

### "connection refused" hatası

1. Supabase projenizin aktif olduğundan emin olun
2. IP whitelist ayarlarını kontrol edin
3. Connection string formatını doğrulayın

## 📞 Yardım

- [Supabase Dokümantasyonu](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma Connection String Rehberi](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

