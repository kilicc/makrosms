# 🔐 Login Sorun Giderme Rehberi

## ✅ Yapılan İyileştirmeler

1. **Login route hata yönetimi iyileştirildi**
   - Detaylı error logging eklendi
   - Password hash null kontrolü eklendi
   - Supabase hata mesajları iyileştirildi
   - Development modunda detaylı hata mesajları

2. **Login test scripti eklendi**
   - `npm run test:login` ile login test edilebilir
   - Kullanıcı arama, şifre doğrulama test ediliyor

## 🔍 Olası Sorunlar ve Çözümleri

### 1. RLS (Row Level Security) Politikası Sorunu

**Sorun:** Supabase'de RLS politikaları users tablosuna erişimi engelliyor olabilir.

**Kontrol:**
```bash
npm run test:login
```

**Çözüm:** Login route'u `supabaseServer` (service key) kullanıyor, bu RLS bypass eder. Eğer hala sorun varsa:

1. Supabase Dashboard > Settings > Database > Row Level Security
2. `users` tablosu için RLS politikalarını kontrol edin
3. Service key ile erişim her zaman bypass eder, bu normaldir

### 2. Password Hash Sorunu

**Sorun:** Kullanıcının password_hash alanı null veya boş.

**Kontrol:**
```bash
npm run test:login
```

Script size password_hash durumunu gösterecektir.

**Çözüm:**
```bash
npm run create:admin
```

Bu komut kullanıcının şifresini yeniden oluşturur.

### 3. Supabase Bağlantı Sorunu

**Sorun:** Supabase service key yanlış veya eksik.

**Kontrol:**
```bash
npm run test:supabase
```

**Çözüm:** `.env` dosyasında `SUPABASE_SERVICE_KEY` doğru olduğundan emin olun.

### 4. Environment Variables Sorunu

**Sorun:** Production'da environment variables yüklenmemiş.

**Kontrol:**
- Vercel/Production ortamında environment variables ekli mi?
- `SUPABASE_SERVICE_KEY` ve `NEXT_PUBLIC_SUPABASE_URL` mevcut mu?

**Çözüm:**
1. Production ortamında (Vercel, vb.) Settings > Environment Variables
2. Tüm `.env` değişkenlerini ekleyin

## 🧪 Test Komutları

### Login Testi
```bash
npm run test:login
```

### Supabase Bağlantı Testi
```bash
npm run test:supabase
```

### Admin Kullanıcı Oluşturma/Güncelleme
```bash
npm run create:admin
```

## 📋 Debug Adımları

### 1. Login Testi Çalıştırın
```bash
npm run test:login
```

Bu size şunları gösterecektir:
- Kullanıcı bulundu mu?
- Password hash mevcut mu?
- Şifre doğrulama başarılı mı?

### 2. Console Loglarını Kontrol Edin

Production'da login yapmayı deneyin ve console loglarını kontrol edin:

```
Login - Kullanıcı arama hatası: {...}
```

veya

```
Login error: {...}
```

### 3. Network Tab'ı Kontrol Edin

Browser Developer Tools > Network tab'ında:
- `/api/auth/login` isteğini kontrol edin
- Response'u kontrol edin
- Status code'u kontrol edin (401, 500, vb.)

## 🐛 Yaygın Hatalar

### "Kullanıcı adı veya şifre hatalı"
- Kullanıcı bulunamadı veya şifre yanlış
- `npm run test:login` ile kontrol edin

### "Giriş hatası. Lütfen daha sonra tekrar deneyin."
- Supabase bağlantı sorunu
- Password hash null
- RLS policy sorunu
- Console loglarını kontrol edin

### "Kullanıcı hesabında sorun var. Lütfen yönetici ile iletişime geçin."
- Password hash null
- `npm run create:admin` ile şifreyi reset edin

## 🔧 Hızlı Çözüm

Eğer login çalışmıyorsa:

1. **Admin kullanıcıyı yeniden oluşturun:**
```bash
npm run create:admin
```

2. **Login testi yapın:**
```bash
npm run test:login
```

3. **Supabase bağlantısını test edin:**
```bash
npm run test:supabase
```

4. **Production environment variables'ları kontrol edin:**
   - SUPABASE_SERVICE_KEY
   - NEXT_PUBLIC_SUPABASE_URL

## 📞 Daha Fazla Yardım

Eğer sorun devam ediyorsa:

1. Console loglarını kontrol edin
2. Network tab'ında response'u kontrol edin
3. Supabase Dashboard > Logs'u kontrol edin
4. `npm run test:login` çıktısını paylaşın

