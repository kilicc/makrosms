# 🔐 Supabase Database Şifre Sıfırlama Rehberi

## Eğer Authentication Hatası Devam Ediyorsa

Connection string doğru görünüyorsa ama hala authentication hatası alıyorsanız, şifreyi sıfırlamak en güvenli çözümdür.

## Adım Adım Şifre Sıfırlama

### 1. Supabase Dashboard'a Gidin

1. https://supabase.com adresine gidin
2. Giriş yapın
3. Projenizi seçin

### 2. Database Password'ü Sıfırlayın

1. Sol menüden **Settings** (⚙️) ikonuna tıklayın
2. **Database** sekmesine gidin
3. **Database password** bölümünü bulun
4. **Reset database password** butonuna tıklayın
5. Yeni bir şifre oluşturun (güçlü bir şifre seçin)
6. Şifreyi kaydedin (güvenli bir yere not edin)

### 3. Yeni Connection String Alın

1. **Settings** > **Database** > **Connection string** bölümüne gidin
2. **URI** formatını seçin
3. Connection string'i kopyalayın
4. **ÖNEMLİ:** Şifre connection string'de zaten olacak veya `[YOUR-PASSWORD]` yazacak

### 4. Connection String Formatı

Eğer connection string'de `[YOUR-PASSWORD]` yazıyorsa:

1. Yeni oluşturduğunuz şifreyi `[YOUR-PASSWORD]` yerine yazın
2. Şifrede özel karakterler varsa URL encode edin:
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`
   - `&` → `%26`
   - `+` → `%2B`
   - `/` → `%2F`
   - `=` → `%3D`
   - `?` → `%3F`

### 5. .env Dosyasını Güncelleyin

1. `.env` dosyanızı açın
2. `DATABASE_URL` satırını bulun
3. Yeni connection string ile değiştirin

Örnek:
```env
DATABASE_URL=postgresql://postgres:[YENİ-ŞİFRE]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public
```

### 6. Test Edin

```bash
npx prisma db pull
```

Eğer başarılı olursa:
```bash
npx prisma generate
npx prisma validate
```

## Alternatif: Connection Pooling Kullanın

Eğer direct connection çalışmıyorsa, Connection Pooling kullanmayı deneyin:

1. **Settings** > **Database** > **Connection Pooling** bölümüne gidin
2. **Connection string** kısmından **URI** formatını alın
3. Bu format genellikle daha güvenilir çalışır

Connection Pooling formatı:
```
postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Güvenlik İpuçları

1. **Güçlü şifre kullanın:** En az 12 karakter, büyük/küçük harf, rakam ve özel karakter
2. **Şifreyi güvenli saklayın:** Password manager kullanın
3. **Connection string'i paylaşmayın:** `.env` dosyasını commit etmeyin
4. **Düzenli olarak şifre değiştirin:** Güvenlik için düzenli olarak şifre değiştirin

## Sorun Giderme

### "invalid port number" hatası
- Port numarasını kontrol edin (5432 veya 6543)
- Connection string formatını doğrulayın

### "authentication failed" hatası
- Şifrenizi kontrol edin
- Şifrede özel karakterler varsa URL encode edin
- Connection Pooling formatını deneyin

### "connection refused" hatası
- Supabase projenizin aktif olduğundan emin olun
- IP whitelist ayarlarını kontrol edin
- Network restrictions ayarlarını kontrol edin

## Başarılı Olduğunda

Eğer `npx prisma db pull` başarılı olursa:

1. ✅ Prisma şeması Supabase'den çekildi
2. ✅ Veritabanı bağlantısı çalışıyor
3. ✅ Artık `npm run dev` ile uygulamayı başlatabilirsiniz

## Sonraki Adımlar

1. `npx prisma db pull` - Veritabanı şemasını çek
2. `npx prisma generate` - Prisma Client'ı oluştur
3. `npm run dev` - Development server'ı başlat
4. http://localhost:3000 - Uygulamayı test et

