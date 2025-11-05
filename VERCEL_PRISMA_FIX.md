# 🔧 Vercel Prisma Prepared Statement Hatası Çözümü

## ❌ Hata
```
ConnectorError: prepared statement "s0" already exists
```

## 🔍 Sorun
Vercel'de serverless ortamda Prisma Client her request'te yeniden oluşturuluyor ve prepared statement'lar çakışıyor.

## ✅ Çözüm

### 1. Connection Pooling Kullanın (ÖNERİLEN)

Vercel'de `DATABASE_URL` için **Connection Pooling** (port 6543) kullanın ve `connection_limit=1` parametresi ekleyin.

**Vercel Environment Variables'da:**
```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Özellikler:**
- Port: `6543` (pooled connection)
- `pgbouncer=true` parametresi
- `connection_limit=1` (Prisma için kritik - prepared statement çakışmasını önler)

### 2. Supabase Connection Pooling String'i Alın

1. Supabase Dashboard → **Settings** → **Database** → **Connection Pooling**
2. **Transaction mode** seçin (Prisma için önerilen)
3. **URI** formatını kopyalayın
4. Sonuna `&connection_limit=1` ekleyin

### 3. Vercel'de Environment Variable Güncelleyin

1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. `DATABASE_URL` değişkenini bulun
3. **Edit** → Value kısmını connection pooling string'i ile değiştirin
4. **Save** → **Redeploy**

## 📝 Örnek Connection String

**Transaction Mode (Prisma için önerilen):**
```
postgresql://postgres.ercvagagcdkpsuuygluu:your_password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Önemli Parametreler:**
- `pgbouncer=true` - Connection pooling aktif
- `connection_limit=1` - Her Prisma Client instance için 1 connection (prepared statement çakışmasını önler)

## 🔄 Alternatif: Prisma Client Pattern İyileştirmesi

Eğer hata devam ederse, `lib/prisma.ts` dosyası zaten güncellendi. Serverless ortam için singleton pattern kullanılıyor.

## ✅ Kontrol

1. Vercel'de `DATABASE_URL` connection pooling string'i kullanıyor mu?
2. `connection_limit=1` parametresi var mı?
3. Yeni deployment yapıldı mı?
4. Build başarılı mı?

## 🐛 Hala Çalışmıyorsa

1. **Vercel Logs'u kontrol edin** - Deployment → Logs
2. **Connection string formatı** - Supabase'den aldığınız string'i olduğu gibi kullanın
3. **Şifre URL encoding** - Özel karakterler encode edilmeli

