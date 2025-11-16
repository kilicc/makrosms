# 🔧 Vercel Environment Variables Kurulumu

## ⚠️ ÖNEMLİ: Vercel `.env` Dosyasını Otomatik Okumaz!

Vercel'de environment variables'ları **manuel olarak** eklemeniz gerekir.

## 📋 Adım Adım Kurulum

### 1. Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard adresine gidin
2. Projenizi seçin: `makrosms2`
3. **Settings** (⚙️) sekmesine tıklayın
4. Sol menüden **Environment Variables** seçin

### 2. Environment Variables Ekleyin

Aşağıdaki tüm environment variables'ları ekleyin:

#### ✅ DATABASE_URL (EN ÖNEMLİSİ!)

1. **Key**: `DATABASE_URL`
2. **Value**: Supabase'den aldığınız connection string

**Supabase'den Connection String Nasıl Alınır:**

**Yöntem 1: Connection Pooling (Vercel için ÖNERİLEN)**

1. https://supabase.com → Projenizi seçin
2. **Settings** → **Database** → **Connection Pooling**
3. **URI** formatını seçin
4. Connection string'i kopyalayın
5. `[YOUR-PASSWORD]` kısmını gerçek şifrenizle değiştirin
6. Format: `postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

**Yöntem 2: Direct Connection (Alternatif)**

1. https://supabase.com → Projenizi seçin
2. **Settings** → **Database** → **Connection string**
3. **URI** formatını seçin
4. Connection string'i kopyalayın
5. `[YOUR-PASSWORD]` kısmını gerçek şifrenizle değiştirin
6. ⚠️ Vercel'de IP whitelist sorunları olabilir

**Formatlar:**

**✅ Vercel için ÖNERİLEN: Connection Pooling (Port 6543)**
```
postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Alternatif: Direct Connection (Port 5432) - Vercel'de sorun çıkarabilir**
```
postgresql://postgres:[ŞİFRE]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**⚠️ ÖNEMLİ:** Vercel deployment'ları için **Connection Pooling** (port 6543) kullanın. Direct connection (port 5432) IP whitelist sorunları nedeniyle çalışmayabilir.

**ÖNEMLİ - URL Encoding:**
Şifrenizde özel karakterler varsa encode edin:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`
- `=` → `%3D`
- `?` → `%3F`
- `!` → `%21`

**Environment**: Hem **Production** hem **Preview** hem **Development** seçin

---

#### ✅ Supabase Variables

**NEXT_PUBLIC_SUPABASE_URL**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Supabase projenizin URL'i (örn: `https://xxxxx.supabase.co`)
- Environment: Production, Preview, Development

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Supabase Dashboard → Settings → API → anon public key
- Environment: Production, Preview, Development

**SUPABASE_SERVICE_KEY**
- Key: `SUPABASE_SERVICE_KEY`
- Value: Supabase Dashboard → Settings → API → service_role key (secret)
- Environment: Production, Preview, Development

---

#### ✅ JWT Configuration

**JWT_SECRET**
- Key: `JWT_SECRET`
- Value: Güçlü bir secret key (örn: `your_super_secret_jwt_key_here_change_this_in_production`)
- Environment: Production, Preview, Development

**JWT_EXPIRE**
- Key: `JWT_EXPIRE`
- Value: `7d` (veya istediğiniz süre)
- Environment: Production, Preview, Development

---

#### ✅ CepSMS Configuration

**CEPSMS_USERNAME**
- Key: `CEPSMS_USERNAME`
- Value: `Testfn`
- Environment: Production, Preview, Development

**CEPSMS_PASSWORD**
- Key: `CEPSMS_PASSWORD`
- Value: `Qaswed`
- Environment: Production, Preview, Development

**CEPSMS_FROM**
- Key: `CEPSMS_FROM`
- Value: `CepSMS`
- Environment: Production, Preview, Development

---

#### ✅ Crypto Payment (Opsiyonel)

**COINMARKETCAP_API_KEY**
- Key: `COINMARKETCAP_API_KEY`
- Value: CoinMarketCap API key'iniz
- Environment: Production, Preview, Development

**COLD_WALLET_DEFAULT**
- Key: `COLD_WALLET_DEFAULT`
- Value: Varsayılan cüzdan adresi
- Environment: Production, Preview, Development

---

#### ✅ Next.js Configuration

**NEXT_PUBLIC_API_URL**
- Key: `NEXT_PUBLIC_API_URL`
- Value: `/api` (veya tam URL)
- Environment: Production, Preview, Development

**NODE_ENV**
- Key: `NODE_ENV`
- Value: `production`
- Environment: Production, Preview, Development

---

### 3. Environment Variables'ları Kaydedin

Her değişkeni ekledikten sonra:
1. **Environment** seçimini yapın (Production, Preview, Development - hepsini seçin)
2. **Save** butonuna tıklayın

### 4. Yeni Deployment Yapın

Environment variables ekledikten sonra:
1. **Deployments** sekmesine gidin
2. Son deployment'ın yanındaki **⋯** (three dots) → **Redeploy** seçin
3. Veya yeni bir commit push edin

---

## 🔍 Kontrol Listesi

Environment variables ekledikten sonra kontrol edin:

- [ ] `DATABASE_URL` eklendi mi?
- [ ] `NEXT_PUBLIC_SUPABASE_URL` eklendi mi?
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` eklendi mi?
- [ ] `SUPABASE_SERVICE_KEY` eklendi mi?
- [ ] `JWT_SECRET` eklendi mi?
- [ ] `JWT_EXPIRE` eklendi mi?
- [ ] `CEPSMS_USERNAME` eklendi mi?
- [ ] `CEPSMS_PASSWORD` eklendi mi?
- [ ] `CEPSMS_FROM` eklendi mi?
- [ ] Tüm variables hem Production hem Preview hem Development için eklendi mi?

---

## 🐛 Sorun Giderme

### "Environment variable not found: DATABASE_URL" Hatası

**Çözüm:**
1. Vercel Dashboard → Settings → Environment Variables
2. `DATABASE_URL` değişkeninin ekli olduğundan emin olun
3. Environment seçimlerini kontrol edin (Production, Preview, Development)
4. Deployment'ı yeniden yapın

### "Invalid connection string" Hatası

**Çözüm:**
1. `DATABASE_URL` formatını kontrol edin
2. Şifredeki özel karakterleri URL encode edin
3. Supabase'den connection string'i yeniden alın

### Build Başarılı Ama Runtime'da Hata

**Çözüm:**
1. Environment variables'ların doğru environment'larda eklendiğinden emin olun
2. `NEXT_PUBLIC_*` prefix'li değişkenlerin client-side'da kullanılabilir olduğundan emin olun
3. Secret key'lerin (`JWT_SECRET`, `SUPABASE_SERVICE_KEY`) ekli olduğundan emin olun

---

## 📝 Notlar

- Vercel environment variables'ları **build time** ve **runtime**'da kullanılabilir
- `NEXT_PUBLIC_*` prefix'li değişkenler client-side'da expose edilir
- Secret key'ler (`JWT_SECRET`, `SUPABASE_SERVICE_KEY`) asla client-side'da kullanılmamalı
- `DATABASE_URL` sadece server-side'da kullanılır (Prisma, API routes)

## 🔗 Yararlı Linkler

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Connection String Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)

