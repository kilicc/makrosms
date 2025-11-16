# 🔌 Supabase Client Bağlantı Kurulumu

## Önkoşullar

Supabase client kullanmak için `.env` dosyasında aşağıdaki environment variable'lar gerekli:

1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase proje URL'i
2. `SUPABASE_SERVICE_KEY` - Service role key (admin yetkileri)
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (client-side için)

## 📋 Adım Adım Kurulum

### 1. Supabase Dashboard'dan Key'leri Alın

#### Supabase URL ve Keys Nasıl Bulunur:

1. **Supabase Dashboard**'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. **Settings** (⚙️) → **API** bölümüne gidin

#### Gerekli Bilgiler:

- **Project URL**: `https://your-project.supabase.co`
  - Örnek: `https://cuvvmpbenpnchikkxevz.supabase.co`

- **anon/public key**: Client-side için (public key)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` olarak kullanılır

- **service_role key**: Server-side için (secret key - admin yetkileri)
  - `SUPABASE_SERVICE_KEY` olarak kullanılır
  - ⚠️ **ÖNEMLİ**: Bu key'i **asla** client-side'da kullanmayın!

### 2. .env Dosyasını Güncelleyin

`.env` dosyanızı açın ve aşağıdaki satırları ekleyin/güncelleyin:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cuvvmpbenpnchikkxevz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (Prisma için - opsiyonel)
DATABASE_URL=postgresql://postgres:Tkaipd775%21@db.cuvvmpbenpnchikkxevz.supabase.co:5432/postgres
```

### 3. Bağlantıyı Test Edin

```bash
npm run test:supabase
```

**Başarılı çıktı:**
```
✅ Supabase URL bulundu
✅ Service Key bulundu
✅ Bağlantı başarılı!
✅ Tablolar kontrol edildi
```

### 4. Tabloları Oluşturun

Supabase client ile tablo oluşturma sınırlıdır. **En iyi yöntem SQL Editor kullanmak:**

#### Yöntem 1: Supabase Dashboard SQL Editor (ÖNERİLEN)

1. Supabase Dashboard → **SQL Editor**
2. **New Query** butonuna tıklayın
3. `supabase_full_schema.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **Run** butonuna tıklayın

#### Yöntem 2: Script ile (Manuel Yönlendirme)

```bash
npm run setup:supabase
```

Bu script size SQL dosyasının yolunu gösterir ve manuel kurulum talimatları verir.

## 🔐 Key Güvenliği

### Service Role Key (SUPABASE_SERVICE_KEY)

- ✅ **Server-side** kullanım için güvenli
- ✅ RLS (Row Level Security) bypass eder
- ✅ Admin yetkileri verir
- ❌ **ASLA** client-side'da kullanmayın!
- ❌ **ASLA** public repository'ye commit etmeyin!
- ❌ `.env` dosyasını `.gitignore`'da tutun!

### Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

- ✅ Client-side kullanım için güvenli
- ✅ RLS kurallarına tabidir
- ✅ Public olarak expose edilebilir (Next.js public variable)
- ✅ Sadece yetkili kullanıcılar verilere erişebilir

## 📊 Test Komutları

### Supabase Client Bağlantısını Test Et

```bash
npm run test:supabase
```

### Prisma Bağlantısını Test Et

```bash
npm run test:db
```

### Her İkisini de Test Et

```bash
npm run test:supabase && npm run test:db
```

## 🛠️ Kullanım

### Server-Side (API Routes, Server Actions)

```typescript
import { getSupabaseServer } from '@/lib/supabase-server';

// RLS bypass - admin yetkileri
const supabase = getSupabaseServer();

const { data, error } = await supabase
  .from('users')
  .select('*');
```

### Client-Side (React Components)

```typescript
import { getSupabaseClient } from '@/lib/supabase-server';

// RLS kurallarına tabidir
const supabase = getSupabaseClient();

const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

## ❓ Sorun Giderme

### "SUPABASE_URL bulunamadı" Hatası

1. `.env` dosyasında `NEXT_PUBLIC_SUPABASE_URL` var mı kontrol edin
2. Format: `https://your-project.supabase.co`
3. Supabase Dashboard > Settings > API > Project URL'den kopyalayın

### "SUPABASE_SERVICE_KEY bulunamadı" Hatası

1. `.env` dosyasında `SUPABASE_SERVICE_KEY` var mı kontrol edin
2. Supabase Dashboard > Settings > API > service_role key'den kopyalayın
3. Key'in tam olarak kopyalandığından emin olun

### "JWT/API Key geçersiz" Hatası

1. Key'lerin doğru kopyalandığından emin olun
2. Key'lerde boşluk veya ekstra karakter olmamalı
3. Supabase Dashboard'dan key'leri yeniden kopyalayın

### Bağlantı Başarısız

1. Supabase projesinin **aktif** olduğundan emin olun (paused değil)
2. İnternet bağlantınızı kontrol edin
3. Supabase Status sayfasını kontrol edin: https://status.supabase.com/

## ✅ Kontrol Listesi

- [ ] `NEXT_PUBLIC_SUPABASE_URL` eklendi
- [ ] `SUPABASE_SERVICE_KEY` eklendi
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` eklendi
- [ ] `npm run test:supabase` başarılı
- [ ] Tablolar oluşturuldu (SQL Editor ile)
- [ ] `.env` dosyası `.gitignore`'da

## 📚 Kaynaklar

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Hızlı Başlangıç

1. ✅ `.env` dosyasını yapılandırın
2. ✅ `npm run test:supabase` ile test edin
3. ✅ Supabase Dashboard > SQL Editor'den tabloları oluşturun
4. ✅ Projenizi kullanmaya başlayın!

