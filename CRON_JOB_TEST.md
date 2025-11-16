# 🔍 Cron Job Test Rehberi

Cron job'ların çalışıp çalışmadığını kontrol etmek için bu rehberi kullanın.

## ✅ Yapılan Düzeltmeler

### 1. İade Talebi Oluştur Butonu Kaldırıldı
- ✅ Platform tarafı (`app/refunds/page.tsx`) - Buton ve dialog kaldırıldı
- ✅ İade işlemleri artık tamamen otomatik
- ✅ Kullanıcılar sadece iade durumlarını görebilir

### 2. Cron Job Hatası Düzeltildi
- ✅ Alpine Linux container'ında `bash` yok, `sh` kullanılmalı
- ✅ Dokploy Schedule'larda **Shell Type: "Sh"** seçilmeli
- ✅ Dockerfile'a `curl` eklendi (cron job'lar için gerekli)

## 🧪 Cron Job'ları Test Etme

### Yöntem 1: Dokploy Schedule Logları

1. **Dokploy Dashboard** → Projeniz → **"Schedules"** sekmesi
2. Her schedule'ın yanında **"Logs"** veya **"History"** butonuna tıklayın
3. Son çalışma zamanını ve sonucunu kontrol edin

### Yöntem 2: Manuel Test (Container İçinden)

Container'a bağlanıp manuel olarak test edin:

```bash
# Container ID'yi bulun
docker ps | grep makrosms

# Container'a bağlanın
docker exec -it CONTAINER_ID sh

# Environment variable'ı kontrol edin
echo $CRON_SECRET_KEY

# SMS durum kontrolü test
curl -X POST -H "x-secret-key: $CRON_SECRET_KEY" -H "Content-Type: application/json" http://localhost:3000/api/sms/check-status

# Otomatik iade test
curl -X POST -H "x-secret-key: $CRON_SECRET_KEY" -H "Content-Type: application/json" http://localhost:3000/api/refunds/process-auto
```

### Yöntem 3: API Endpoint'lerini Doğrudan Test Etme

Dışarıdan test etmek için:

```bash
# CRON_SECRET_KEY'i alın (Dokploy Environment Variables'dan)
CRON_SECRET_KEY="your-secret-key-here"

# SMS durum kontrolü test
curl -X POST \
  -H "x-secret-key: $CRON_SECRET_KEY" \
  -H "Content-Type: application/json" \
  https://makrosms.com/api/sms/check-status

# Otomatik iade test
curl -X POST \
  -H "x-secret-key: $CRON_SECRET_KEY" \
  -H "Content-Type: application/json" \
  https://makrosms.com/api/refunds/process-auto
```

## 📊 Başarılı Yanıt Örnekleri

### SMS Durum Kontrolü Başarılı Yanıt:

```json
{
  "success": true,
  "message": "SMS durum kontrolü tamamlandı",
  "data": {
    "checked": 5,
    "delivered": 3,
    "failed": 1,
    "errors": 0,
    "total": 5
  }
}
```

### Otomatik İade Başarılı Yanıt:

```json
{
  "success": true,
  "message": "Otomatik iade işleme tamamlandı",
  "data": {
    "processed": 2,
    "cancelled": 0,
    "errors": 0,
    "total": 2
  }
}
```

## ❌ Hata Durumları

### 401 Unauthorized

**Sebep:** `CRON_SECRET_KEY` yanlış veya eksik

**Çözüm:**
1. Dokploy Dashboard → **Environment** sekmesinde `CRON_SECRET_KEY` tanımlı mı kontrol edin
2. Schedule command'ında `$CRON_SECRET_KEY` doğru yazılmış mı kontrol edin
3. Environment variable'ın container'a deploy edildiğinden emin olun

### Connection Refused

**Sebep:** Container içinde `localhost:3000` erişilemiyor

**Çözüm:**
1. Container'ın çalıştığından emin olun: `docker ps`
2. Port 3000'in açık olduğundan emin olun
3. Container network'ünde service name kullanmayı deneyin

### curl: command not found

**Sebep:** Container'da `curl` yüklü değil

**Çözüm:**
- Dockerfile'a `curl` eklendi, rebuild edin:
  ```dockerfile
  RUN apk add --no-cache openssl libc6-compat curl
  ```

### bash: executable file not found

**Sebep:** Alpine Linux'ta `bash` yok

**Çözüm:**
- Dokploy Schedule'da **Shell Type: "Sh"** seçin (bash değil)

## 🔧 Dokploy Schedule Ayarları (Güncellenmiş)

### SMS Durum Kontrolü:
- **Task Name**: `SMS Durum Kontrolü`
- **Schedule**: `*/5 * * * *`
- **Shell Type**: `Sh` ⚠️ (bash değil!)
- **Command**: 
  ```sh
  curl -X POST -H "x-secret-key: $CRON_SECRET_KEY" -H "Content-Type: application/json" http://localhost:3000/api/sms/check-status
  ```
- **Enabled**: `ON`

### Otomatik İade İşleme:
- **Task Name**: `Otomatik İade İşleme`
- **Schedule**: `0 * * * *`
- **Shell Type**: `Sh` ⚠️ (bash değil!)
- **Command**: 
  ```sh
  curl -X POST -H "x-secret-key: $CRON_SECRET_KEY" -H "Content-Type: application/json" http://localhost:3000/api/refunds/process-auto
  ```
- **Enabled**: `ON`

## 📝 Kontrol Listesi

- [ ] `CRON_SECRET_KEY` Environment Variable eklendi
- [ ] Shell Type: **"Sh"** seçildi (bash değil)
- [ ] Command'da `$CRON_SECRET_KEY` kullanıldı
- [ ] URL: `http://localhost:3000` (container içinden)
- [ ] Schedule aktif (Enabled: ON)
- [ ] Dockerfile'a `curl` eklendi
- [ ] Container rebuild edildi

## 🎉 Sonuç

Cron job'lar artık:
- ✅ Alpine Linux ile uyumlu (sh kullanıyor)
- ✅ curl yüklü
- ✅ Otomatik çalışıyor
- ✅ İade işlemleri tamamen otomatik

