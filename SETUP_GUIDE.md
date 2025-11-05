# 🚀 Kurulum Rehberi

## Hızlı Başlangıç

### 1. Ortam Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin ve Supabase bilgilerinizi ekleyin:

```env
# Supabase Configuration (Supabase Dashboard'dan alın)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Database (Supabase PostgreSQL Connection String)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# JWT Configuration (Güvenli bir random string kullanın)
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# CepSMS Configuration (CepSMS hesabınızdan alın)
CEPSMS_USERNAME=Testfn
CEPSMS_PASSWORD=Qaswed
CEPSMS_FROM=CepSMS

# Crypto Payment Configuration
COINMARKETCAP_API_KEY=17aa5b111c584455912e0242e7dee2ce
COLD_WALLET_DEFAULT=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5

# Next.js Configuration
NEXT_PUBLIC_API_URL=/api
```

### 2. Supabase Veritabanı Şemasını Çekin

```bash
npx prisma db pull
```

Bu komut Supabase'deki mevcut tabloları `prisma/schema.prisma` dosyasına çekecektir.

### 3. Prisma Client'ı Oluşturun

```bash
npx prisma generate
```

Bu komut Prisma Client'ı oluşturur ve TypeScript tip tanımlarını üretir.

### 4. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## ✅ Kurulum Kontrol Listesi

- [ ] `.env` dosyası oluşturuldu ve dolduruldu
- [ ] Supabase bağlantı bilgileri eklendi
- [ ] `npx prisma db pull` çalıştırıldı
- [ ] `npx prisma generate` çalıştırıldı
- [ ] `npm run dev` ile server başlatıldı
- [ ] [http://localhost:3000](http://localhost:3000) açıldı ve çalışıyor

## 🔧 Sorun Giderme

### Prisma db pull hatası

Eğer `prisma db pull` komutu hata verirse:

1. `.env` dosyasındaki `DATABASE_URL` değerini kontrol edin
2. Supabase bağlantı string'inin doğru olduğundan emin olun
3. Supabase projenizde RLS (Row Level Security) ayarlarını kontrol edin

### Prisma generate hatası

Eğer `prisma generate` komutu hata verirse:

1. `prisma/schema.prisma` dosyasının doğru olduğundan emin olun
2. `npm install` komutunu çalıştırın
3. Node.js versiyonunuzun 18+ olduğundan emin olun

### Build hatası

Eğer `npm run build` komutu hata verirse:

1. TypeScript hatalarını kontrol edin: `npm run type-check`
2. Lint hatalarını kontrol edin: `npm run lint`
3. Tüm bağımlılıkların yüklü olduğundan emin olun: `npm install`

## 📚 Ek Kaynaklar

- [Next.js 16 Dokümantasyonu](https://nextjs.org/docs)
- [Prisma Dokümantasyonu](https://www.prisma.io/docs)
- [Supabase Dokümantasyonu](https://supabase.com/docs)

