# 🔍 Supabase Verileri Görünmüyor - Çözüm Rehberi

## ❌ Sorun
Supabase'deki veriler uygulamada görünmüyor.

## 🔍 Olası Nedenler

### 1. Row Level Security (RLS) Aktif
Supabase'de RLS aktifse, Prisma ile direkt bağlantıda veriler görünmeyebilir.

### 2. Prisma Client Güncel Değil
Vercel'de Prisma Client eski sürümde olabilir.

### 3. Environment Variables Eksik
Vercel'de gerekli environment variables eksik olabilir.

---

## ✅ Çözüm Adımları

### 1. Supabase'deki Verileri Kontrol Edin

**Supabase Dashboard:**
1. https://supabase.com → Projeniz
2. **Table Editor** → Tabloları kontrol edin
3. Verilerin gerçekten var olduğundan emin olun

### 2. RLS Politikalarını Kontrol Edin

**Supabase Dashboard:**
1. **Authentication** → **Policies** → Tabloları kontrol edin
2. Her tablo için RLS politikalarını görüntüleyin

**Eğer RLS engelliyorsa:**

**Seçenek A: RLS'i Geçici Olarak Devre Dışı Bırakın (Geliştirme için)**
```sql
-- Supabase SQL Editor'de çalıştırın
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE refunds DISABLE ROW LEVEL SECURITY;
```

**Seçenek B: RLS Politikalarını Düzenleyin (Production için Önerilen)**

Supabase Dashboard → **Authentication** → **Policies** → Her tablo için:

```sql
-- users tablosu için - tüm kayıtları göster
CREATE POLICY "Enable read access for all users" ON users
FOR SELECT USING (true);

-- contacts tablosu için - kullanıcılar kendi verilerini görsün
CREATE POLICY "Users can view own contacts" ON contacts
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Diğer tablolar için benzer şekilde...
```

### 3. Prisma ile Veri Kontrolü

**Local'de test edin:**
```bash
# Prisma Studio'yu açın
npx prisma studio
```

Bu, local'deki `.env` dosyasındaki `DATABASE_URL` ile bağlanır ve verileri gösterir.

### 4. Vercel'de Prisma Client'ı Yeniden Generate Edin

Vercel'de build sırasında Prisma Client otomatik generate edilir, ancak:

1. **Vercel Dashboard** → **Deployments** → Son deployment
2. **Build Logs**'u kontrol edin
3. `prisma generate` komutunun çalıştığından emin olun

**Eğer çalışmadıysa:**
1. `package.json`'daki `postinstall` script'ini kontrol edin:
   ```json
   "postinstall": "prisma generate"
   ```
2. `vercel.json`'daki build command'i kontrol edin:
   ```json
   {
     "buildCommand": "npm run build"
   }
   ```

### 5. Vercel'de Environment Variables'ı Kontrol Edin

Vercel Dashboard → **Settings** → **Environment Variables**:

- `DATABASE_URL` - Connection pooling string (port 6543)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

**ÖNEMLİ:** `SUPABASE_SERVICE_KEY` varsa, RLS'i bypass eder ve tüm verileri görebilirsiniz.

### 6. Supabase Service Key ile Bağlantı

Eğer `SUPABASE_SERVICE_KEY` kullanıyorsanız, RLS'i bypass edersiniz. Ancak Prisma direkt database connection kullanıyor, bu yüzden:

**Seçenek: Supabase Client kullanın (RLS'i bypass eder)**

```typescript
// lib/supabase.ts'de zaten var
import { supabaseAdmin } from '@/lib/supabase';

// Service key ile veri çekme (RLS bypass)
const { data, error } = await supabaseAdmin
  .from('users')
  .select('*');
```

---

## 🧪 Test Senaryoları

### Test 1: Prisma Studio ile Kontrol
```bash
npx prisma studio
```
- Local'deki `.env` ile bağlanır
- Veriler görünüyorsa → Prisma çalışıyor
- Veriler görünmüyorsa → RLS veya bağlantı sorunu

### Test 2: Supabase SQL Editor ile Kontrol
```sql
-- Supabase SQL Editor'de çalıştırın
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM contacts;
SELECT COUNT(*) FROM sms_messages;
```
- Veriler varsa → RLS sorunu
- Veriler yoksa → Veri yok

### Test 3: API Route ile Test
```typescript
// app/api/test-data/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return Response.json({ count: users.length, users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 🔧 Hızlı Çözümler

### Çözüm 1: RLS'i Devre Dışı Bırak (Geliştirme)

Supabase SQL Editor'de:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE refunds DISABLE ROW LEVEL SECURITY;
```

### Çözüm 2: RLS Politikalarını Düzenle (Production)

```sql
-- Tüm kullanıcılar tüm verileri görebilir (geliştirme için)
CREATE POLICY "Enable read for all" ON users
FOR SELECT USING (true);

CREATE POLICY "Enable read for all" ON contacts
FOR SELECT USING (true);

CREATE POLICY "Enable read for all" ON contact_groups
FOR SELECT USING (true);

CREATE POLICY "Enable read for all" ON sms_messages
FOR SELECT USING (true);

CREATE POLICY "Enable read for all" ON sms_templates
FOR SELECT USING (true);

CREATE POLICY "Enable read for all" ON payments
FOR SELECT USING (true);

CREATE POLICY "Enable read for all" ON refunds
FOR SELECT USING (true);
```

### Çözüm 3: Vercel'de Yeni Deployment

1. Vercel Dashboard → **Deployments**
2. Son deployment → **⋯** → **Redeploy**
3. Build loglarını kontrol edin

---

## 📝 Kontrol Listesi

- [ ] Supabase Table Editor'da veriler var mı?
- [ ] Prisma Studio'da veriler görünüyor mu?
- [ ] RLS politikaları kontrol edildi mi?
- [ ] Vercel'de environment variables doğru mu?
- [ ] Vercel'de build başarılı mı?
- [ ] Prisma Client generate edildi mi?

---

## 🔗 Yararlı Linkler

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Prisma + Supabase](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 💡 Öneri

**Production için:**
- RLS'i tamamen kapatmak yerine, doğru politikalar oluşturun
- `SUPABASE_SERVICE_KEY` kullanarak admin işlemleri yapın
- Prisma ile direkt database connection kullanın (RLS bypass)

**Development için:**
- RLS'i geçici olarak devre dışı bırakabilirsiniz
- Test verileri ekleyin
- API routes'ları test edin

