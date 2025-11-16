# 🔄 Cron Job Kurulum Rehberi

## 📋 Kurulacak Cron Job'lar

### 1. SMS Durum Kontrolü
- **Endpoint**: `/api/sms/check-status`
- **Sıklık**: Her 5 dakikada bir
- **Açıklama**: Gönderilen SMS'lerin durumunu CepSMS API'den kontrol eder ve günceller

### 2. Otomatik İade İşleme
- **Endpoint**: `/api/refunds/process-auto`
- **Sıklık**: Her saat başı
- **Açıklama**: 48 saat önce oluşturulan beklemede iadeleri işler ve kredi iade eder

## 🚀 Dokploy'da Cron Job Kurulumu

### Yöntem 1: Dokploy Dashboard (Önerilen)

1. **Dokploy Dashboard'a gidin**
2. **Projenizi seçin** (`makrosms-v-2okjor` veya benzeri)
3. **Settings → Cron Jobs** bölümüne gidin
4. **Yeni Cron Job Ekle** butonuna tıklayın

#### SMS Durum Kontrolü Cron Job:
- **Name**: `SMS Durum Kontrolü`
- **Schedule**: `*/5 * * * *` (Her 5 dakikada bir)
- **Command**: 
  ```bash
  curl -X POST https://makrosms.com/api/sms/check-status \
    -H "x-secret-key: YOUR_CRON_SECRET_KEY" \
    -H "Content-Type: application/json"
  ```
- **Method**: `POST`
- **URL**: `https://makrosms.com/api/sms/check-status`
- **Headers**: 
  - `x-secret-key: YOUR_CRON_SECRET_KEY`
  - `Content-Type: application/json`

#### Otomatik İade Cron Job:
- **Name**: `Otomatik İade İşleme`
- **Schedule**: `0 * * * *` (Her saat başı)
- **Command**: 
  ```bash
  curl -X POST https://makrosms.com/api/refunds/process-auto \
    -H "x-secret-key: YOUR_CRON_SECRET_KEY" \
    -H "Content-Type: application/json"
  ```
- **Method**: `POST`
- **URL**: `https://makrosms.com/api/refunds/process-auto`
- **Headers**: 
  - `x-secret-key: YOUR_CRON_SECRET_KEY`
  - `Content-Type: application/json`

### Yöntem 2: Sunucuda Manuel Kurulum

Sunucuya SSH ile bağlanın ve şu komutları çalıştırın:

```bash
# Proje dizinine git
cd /var/www/makrosms

# Cron job kurulum script'ini çalıştır
npm run cron:setup

# Veya manuel olarak:
crontab -e
```

Aşağıdaki satırları ekleyin:

```cron
# SMS Durum Kontrolü (Her 5 dakikada bir)
*/5 * * * * curl -X POST https://makrosms.com/api/sms/check-status -H "x-secret-key: YOUR_CRON_SECRET_KEY" -H "Content-Type: application/json" -s -o /dev/null

# Otomatik İade İşleme (Her saat başı)
0 * * * * curl -X POST https://makrosms.com/api/refunds/process-auto -H "x-secret-key: YOUR_CRON_SECRET_KEY" -H "Content-Type: application/json" -s -o /dev/null
```

### Yöntem 3: Vercel Cron Jobs (Vercel kullanıyorsanız)

`vercel.json` dosyası zaten yapılandırıldı. Vercel otomatik olarak cron job'ları kuracaktır.

## 🔑 CRON_SECRET_KEY Oluşturma

`.env` dosyasına `CRON_SECRET_KEY` ekleyin:

```bash
# .env dosyasına ekleyin
CRON_SECRET_KEY=your-secret-key-here-minimum-32-characters
```

Güvenli bir secret key oluşturmak için:

```bash
openssl rand -hex 32
```

## ✅ Kurulum Kontrolü

Cron job'ların çalışıp çalışmadığını kontrol etmek için:

```bash
# Sunucuda cron job'ları listele
crontab -l

# Log dosyasını kontrol et
tail -f /var/log/makrosms/cron.log

# Manuel test
curl -X POST https://makrosms.com/api/sms/check-status \
  -H "x-secret-key: YOUR_CRON_SECRET_KEY" \
  -H "Content-Type: application/json"
```

## 📊 Cron Job Çalışma Zamanları

### SMS Durum Kontrolü
- **Her 5 dakikada bir** çalışır
- Örnek: 10:00, 10:05, 10:10, 10:15, ...
- 5 dakikadan eski "gönderildi" durumundaki mesajları kontrol eder

### Otomatik İade İşleme
- **Her saat başı** çalışır
- Örnek: 10:00, 11:00, 12:00, 13:00, ...
- 48 saat önce oluşturulan beklemede iadeleri işler

## 🔍 Sorun Giderme

### Cron Job Çalışmıyor
1. `.env` dosyasında `CRON_SECRET_KEY` tanımlı mı kontrol edin
2. Endpoint'lerin erişilebilir olduğunu kontrol edin
3. Log dosyasını kontrol edin: `/var/log/makrosms/cron.log`
4. Dokploy Dashboard'da cron job durumunu kontrol edin

### 401 Unauthorized Hatası
- `CRON_SECRET_KEY` doğru mu kontrol edin
- Header'da `x-secret-key` doğru gönderiliyor mu kontrol edin
- `.env` dosyasında `CRON_SECRET_KEY` tanımlı mı kontrol edin

### Endpoint Bulunamadı Hatası
- Domain doğru mu kontrol edin (`https://makrosms.com`)
- API route'ları deploy edildi mi kontrol edin
- Health check endpoint'ini test edin: `/api/health`

## 📝 Notlar

- Cron job'lar opsiyonel olarak `CRON_SECRET_KEY` ile korunabilir
- Eğer `CRON_SECRET_KEY` tanımlı değilse, cron job'lar çalışmaya devam eder (güvenlik riski)
- Production'da mutlaka `CRON_SECRET_KEY` kullanın
- Log dosyaları `/var/log/makrosms/cron.log` konumunda saklanır

