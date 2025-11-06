# 🌐 Dokploy Schedule URL Rehberi

Dokploy Schedule'larda hangi URL'yi kullanmalısınız?

## ✅ Doğru: `http://localhost:3000` (Önerilen)

**Neden?**
- Dokploy Schedule'lar **container içinde** komut çalıştırır
- Container içinden aynı container'daki uygulamaya erişim için `localhost` kullanılır
- Daha hızlı (network trafiği yok)
- Daha güvenli (dışarıdan erişim yok)
- SSL sertifikası gerekmez

**Kullanım:**
```sh
curl -X POST -H "x-secret-key: $CRON_SECRET_KEY" -H "Content-Type: application/json" http://localhost:3000/api/sms/check-status
```

## ❌ Yanlış: `https://panel.finsms.io` (Önerilmez)

**Neden kullanılmamalı?**
- Dışarıdan çağrı yapılır (gereksiz network trafiği)
- SSL sertifikası kontrolü yapılır (yavaşlatır)
- Reverse proxy üzerinden geçer (ekstra gecikme)
- Container içinden dışarıya çıkmak gereksiz

**Ne zaman kullanılır?**
- Sadece harici bir cron servisi kullanıyorsanız (cron-job.org gibi)
- Dokploy Schedule değil, sunucuda manuel cron job kuruyorsanız

## 🔍 Dokploy Schedule Nasıl Çalışır?

```
┌─────────────────────────────────────┐
│  Dokploy Schedule                   │
│  ┌───────────────────────────────┐  │
│  │  Container İçinde             │  │
│  │  docker exec CONTAINER_ID sh  │  │
│  │  └─> curl http://localhost    │  │
│  └───────────────────────────────┘  │
│           │                          │
│           ▼                          │
│  ┌───────────────────────────────┐  │
│  │  Next.js Uygulaması           │  │
│  │  Port: 3000                   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Gördüğünüz gibi:**
- Schedule ve uygulama **aynı container içinde**
- `localhost:3000` ile direkt erişim
- Dışarıdan çağrı yapmaya gerek yok

## 📊 Karşılaştırma

| Özellik | `localhost:3000` | `https://panel.finsms.io` |
|---------|------------------|--------------------------|
| **Hız** | ⚡ Çok hızlı (local) | 🐌 Yavaş (network) |
| **Güvenlik** | 🔒 Güvenli (local) | ⚠️ Dışarıdan erişim |
| **SSL** | ❌ Gerekmez | ✅ Gerekli |
| **Network** | ❌ Gerekmez | ✅ Gerekli |
| **Önerilen** | ✅ **EVET** | ❌ Hayır |

## 🎯 Sonuç

**Dokploy Schedule'larda mutlaka `http://localhost:3000` kullanın!**

**Örnek Schedule Ayarları:**

### SMS Durum Kontrolü:
```sh
curl -X POST -H "x-secret-key: $CRON_SECRET_KEY" -H "Content-Type: application/json" http://localhost:3000/api/sms/check-status
```

### Otomatik İade İşleme:
```sh
curl -X POST -H "x-secret-key: $CRON_SECRET_KEY" -H "Content-Type: application/json" http://localhost:3000/api/refunds/process-auto
```

## ⚠️ Özel Durumlar

### Eğer localhost çalışmıyorsa:

1. **Port kontrolü:**
   - Container'da port 3000 açık mı?
   - `docker ps` ile kontrol edin

2. **Container network:**
   - Bazı durumlarda `127.0.0.1:3000` deneyin
   - Veya container service name kullanın

3. **Alternatif (sadece gerekirse):**
   - Container network'ünde service name kullanın
   - Örnek: `http://finsms:3000` (Dokploy service name)

### Harici Cron Servisi Kullanıyorsanız:

Eğer Dokploy Schedule değil, harici bir servis (cron-job.org) kullanıyorsanız:
- ✅ `https://panel.finsms.io` kullanın
- ✅ SSL sertifikası gerekli
- ✅ Dışarıdan erişim yapılır

## 📝 Özet

- ✅ **Dokploy Schedule**: `http://localhost:3000`
- ❌ **Dokploy Schedule**: `https://panel.finsms.io` (kullanmayın)
- ✅ **Harici Cron Servisi**: `https://panel.finsms.io`

