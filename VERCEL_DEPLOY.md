# Vercel Deployment Guide

## 🚀 Vercel'e Deploy Etme

### 1. GitHub Repository'ye Push

Proje zaten GitHub'a push edildi:
- Repository: https://github.com/kilicc/finsms2.git
- Branch: main

### 2. Vercel'e Import

1. [Vercel Dashboard](https://vercel.com/dashboard) açın
2. "Add New..." → "Project" tıklayın
3. GitHub repository'yi seçin: `kilicc/finsms2`
4. "Import" butonuna tıklayın

### 3. Environment Variables Ayarları

**⚠️ ÖNEMLİ: Vercel `.env` dosyasını otomatik okumaz! Environment variables'ları manuel olarak eklemeniz gerekir.**

Detaylı kurulum için: [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)

Vercel Dashboard → Settings → Environment Variables bölümünde aşağıdaki environment variables'ları ekleyin:

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

#### Database (Supabase PostgreSQL)
```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

**ÖNEMLİ:** `DATABASE_URL` içindeki özel karakterler (özellikle şifrelerde `@`, `#`, `$`, vb.) URL encode edilmelidir:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

#### JWT Configuration
```
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d
```

#### CepSMS Configuration
```
CEPSMS_USERNAME=Testfn
CEPSMS_PASSWORD=Qaswed
CEPSMS_FROM=CepSMS
```

#### Crypto Payment Configuration
```
COINMARKETCAP_API_KEY=17aa5b111c584455912e0242e7dee2ce
COLD_WALLET_DEFAULT=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
```

#### Next.js Configuration
```
NEXT_PUBLIC_API_URL=/api
NODE_ENV=production
```

### 4. Build Settings

Vercel otomatik olarak Next.js projesini algılar. Aşağıdaki ayarlar otomatik olarak yapılır:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (Prisma generate otomatik çalışır)
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 5. Prisma Setup

Vercel build sırasında otomatik olarak `postinstall` script çalışır ve `prisma generate` yapılır.

### 6. Database Migration

**ÖNEMLİ:** Vercel'e deploy etmeden önce Supabase'deki database şemasının güncel olduğundan emin olun:

```bash
# Local'de şemayı kontrol edin
npx prisma db pull
npx prisma generate
npx prisma validate
```

### 7. Deploy

1. Vercel'de "Deploy" butonuna tıklayın
2. Build işlemi tamamlanana kadar bekleyin
3. Deploy tamamlandıktan sonra URL'yi kontrol edin

### 8. Post-Deploy Checklist

- [ ] Environment variables doğru mu?
- [ ] Database bağlantısı çalışıyor mu?
- [ ] API endpoints çalışıyor mu?
- [ ] Authentication çalışıyor mu?
- [ ] SMS gönderimi çalışıyor mu?
- [ ] Payment sistemi çalışıyor mu?

### 9. Custom Domain (Opsiyonel)

1. Vercel Dashboard → Project Settings → Domains
2. Domain ekleyin
3. DNS ayarlarını yapın

### 10. Monitoring

- [Vercel Analytics](https://vercel.com/analytics) - Performans izleme
- [Vercel Logs](https://vercel.com/docs/logs) - Hata logları

## 🔧 Troubleshooting

### Build Hataları

1. **Prisma Generate Hatası:**
   - `postinstall` script'in çalıştığından emin olun
   - `DATABASE_URL` doğru mu kontrol edin

2. **Environment Variables Hatası:**
   - Tüm gerekli environment variables eklendi mi?
   - URL encoding doğru mu?

3. **Database Connection Hatası:**
   - Supabase'de IP whitelist kontrolü yapın
   - Connection string doğru mu?

### Runtime Hataları

1. **API Route 500 Error:**
   - Vercel Logs'u kontrol edin
   - Environment variables doğru mu?

2. **Authentication Hatası:**
   - `JWT_SECRET` doğru mu?
   - Token expiration kontrol edin

## 📝 Notlar

- Vercel otomatik olarak Next.js 16'yı algılar
- Prisma generate build sırasında otomatik çalışır
- Environment variables production'da farklı olabilir
- Database migration'ları manuel yapılmalıdır

## 🔗 Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

