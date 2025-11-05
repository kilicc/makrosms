# 🔧 Connection String Sorunu Çözümü

## Sorun

Authentication hatası alıyorsunuz. Bu genellikle şifre formatı veya connection string formatından kaynaklanır.

## Çözüm: Supabase'den Direkt Connection String Alın

### Adım 1: Supabase Dashboard

1. https://supabase.com adresine gidin
2. Projenizi seçin
3. **Settings** (⚙️) > **Database** bölümüne gidin

### Adım 2: Connection String'i Alın

**Yöntem 1: Direct Connection (Önerilen)**

1. **Connection string** bölümünde **URI** formatını seçin
2. **Session mode** veya **Transaction mode** seçin
3. Connection string'i **TAM OLARAK** kopyalayın
4. Bu string'i `.env` dosyasındaki `DATABASE_URL` ile değiştirin

**Yöntem 2: Connection Pooling (Alternatif)**

1. **Connection Pooling** bölümüne gidin
2. **Connection string** kısmından **URI** formatını alın
3. Bu string'i kullanın (genellikle daha güvenilir)

### Adım 3: .env Dosyasını Güncelleyin

Supabase'den aldığınız connection string'i `.env` dosyasına ekleyin:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**ÖNEMLİ:** 
- Supabase'den aldığınız string'i **OLDUĞU GİBİ** kullanın
- Şifreyi manuel olarak encode etmeyin - Supabase zaten doğru formatta verir
- Connection string'de `[YOUR-PASSWORD]` yazıyorsa, Supabase Dashboard'dan gerçek şifreyi alın

### Adım 4: Şifreyi Kontrol Edin

Eğer connection string'de `[YOUR-PASSWORD]` yazıyorsa:

1. **Settings** > **Database** > **Database password** bölümüne gidin
2. Şifrenizi görüntüleyin veya **Reset database password** ile yeni şifre oluşturun
3. Yeni şifre ile connection string'i yeniden oluşturun

### Adım 5: Test Edin

```bash
npx prisma db pull
```

Eğer hala hata alıyorsanız:

1. Connection Pooling formatını deneyin (port 6543)
2. Direct connection formatını deneyin (port 5432)
3. IP whitelist ayarlarını kontrol edin (Settings > Database > Network restrictions)

## Örnek Connection String Formatları

### Direct Connection
```
postgresql://postgres:[ŞİFRE]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Connection Pooling (Session Mode)
```
postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Connection Pooling (Transaction Mode)
```
postgresql://postgres.[PROJECT-REF]:[ŞİFRE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

## Not

Supabase'den aldığınız connection string'i **DOĞRUDAN** kullanın. Manuel olarak şifre encode etmeye gerek yoktur - Supabase zaten doğru formatta verir.

