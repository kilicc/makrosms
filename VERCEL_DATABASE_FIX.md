# 🔧 Vercel Database Connection Hatası Çözümü

## ❌ Hata
```
Can't reach database server at `db.ercvagagcdkpsuuygluu.supabase.co:5432`
```

## 🔍 Sorun
Vercel deployment'larında direct connection (port 5432) genellikle çalışmaz çünkü:
1. IP whitelist sorunları
2. Network restrictions
3. Connection limit sorunları

## ✅ Çözüm: Connection Pooling Kullanın

Vercel için **Connection Pooling** (port 6543) kullanmalısınız.

---

## 📋 Adım Adım Düzeltme

### 1. Supabase Dashboard'a Gidin

1. https://supabase.com → Projenizi seçin
2. **Settings** (⚙️) → **Database** → **Connection Pooling**

### 2. Connection Pooling String'i Alın

**Connection Pooling** bölümünde:
1. **URI** formatını seçin
2. Connection string'i kopyalayın

**Format şöyle olacak:**
```
postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Örnek:**
```
postgresql://postgres.ercvagagcdkpsuuygluu:your_password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. Vercel'de DATABASE_URL'i Güncelleyin

1. **Vercel Dashboard** → Projeniz → **Settings** → **Environment Variables**
2. `DATABASE_URL` değişkenini bulun
3. **Edit** butonuna tıklayın
4. **Value** kısmını connection pooling string'i ile değiştirin
5. **Save** butonuna tıklayın

### 4. Yeni Deployment Yapın

1. **Deployments** sekmesine gidin
2. Son deployment'ın yanındaki **⋯** (three dots) → **Redeploy** seçin
3. Veya yeni bir commit push edin

---

## 🔄 Alternatif: Direct Connection Kullanmak İsterseniz

Eğer direct connection (port 5432) kullanmak istiyorsanız:

### 1. Supabase Network Restrictions'ı Kontrol Edin

1. Supabase Dashboard → **Settings** → **Database** → **Network Restrictions**
2. **Allow all IPs** seçeneğini aktif edin
3. Veya Vercel'in IP adreslerini whitelist'e ekleyin

**⚠️ NOT:** Vercel'in IP adresleri dinamiktir, bu yüzden bu yöntem önerilmez.

### 2. Connection String Formatı

Direct connection için:
```
postgresql://postgres:[ŞİFRE]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public
```

---

## 🎯 Önerilen Format (Connection Pooling)

Vercel için en güvenilir format:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Özellikler:**
- Port: `6543` (pooled connection)
- Host: `aws-0-[REGION].pooler.supabase.com`
- `pgbouncer=true` parametresi
- `connection_limit=1` (Prisma için önerilen)

---

## 📝 Şifre URL Encoding

Şifrenizde özel karakterler varsa URL encode edin:

- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`
- `=` → `%3D`
- `?` → `%3F`
- `!` → `%21`

**Örnek:**
Şifre: `MyPass@123!` → `MyPass%40123%21`

---

## ✅ Kontrol Listesi

- [ ] Connection Pooling string'i Supabase'den alındı
- [ ] Vercel'de `DATABASE_URL` güncellendi
- [ ] Port 6543 kullanılıyor (pooled connection)
- [ ] Şifre URL encode edildi (gerekirse)
- [ ] Yeni deployment yapıldı
- [ ] Build başarılı oldu
- [ ] Database bağlantısı çalışıyor

---

## 🐛 Hala Çalışmıyorsa

1. **Supabase Projesi Aktif mi?**
   - Supabase Dashboard'da projenizin paused olmadığından emin olun

2. **Şifre Doğru mu?**
   - Supabase Dashboard → Settings → Database → Database password
   - Şifreyi reset edip yeni connection string alın

3. **Connection String Formatı**
   - Supabase'den aldığınız string'i **OLDUĞU GİBİ** kullanın
   - Manuel değişiklik yapmayın

4. **Vercel Logs'u Kontrol Edin**
   - Vercel Dashboard → Deployments → Son deployment → Logs
   - Hata mesajlarını kontrol edin

---

## 🔗 Yararlı Linkler

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma + Supabase](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

