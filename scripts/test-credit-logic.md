# Kredi Düşme Testi - Manuel Test Adımları

## Test Senaryosu
1000 numara ile SMS gönderimi yapıp kredi düşüşünü test etmek.

## Test Adımları

### 1. Mevcut Kredi Durumunu Kontrol Et
- Admin panelinden veya profil sayfasından mevcut kredinizi kontrol edin
- Sistem kredisini (admin kredisini) kontrol edin

### 2. Test SMS Gönderimi
- `/sms` sayfasına gidin
- 1000 test numarası girin (örnek: 90555123400, 90555123401, ... 90555124399)
- Bir test mesajı yazın (örnek: "Test mesajı")
- SMS gönder butonuna tıklayın

### 3. Kredi Düşüşünü Kontrol Et
- Gönderim sonrası kredinizi tekrar kontrol edin
- Sistem kredisini kontrol edin
- Beklenen düşüş: 
  - Mesaj uzunluğu: X karakter
  - Mesaj başına kredi: Math.ceil(X / 180) veya 1
  - Toplam düşüş: (Mesaj başına kredi) × 1000

### 4. Krediyi Geri Yükle
- Admin panelinden kredinizi eski haline getirin
- Sistem kredisini eski haline getirin

## Beklenen Sonuç

### Kredi Hesaplama Formülü:
```
creditPerMessage = Math.ceil(messageLength / 180) || 1
totalCreditNeeded = creditPerMessage × phoneNumbers.length
```

### Örnek:
- Mesaj: "Test mesajı" (12 karakter)
- Mesaj başına kredi: Math.ceil(12 / 180) = 1
- 1000 numara için: 1 × 1000 = 1000 kredi düşmeli

### Kontrol Edilecekler:
1. ✅ Kullanıcı kredisinden düşüyor mu?
2. ✅ Sistem kredisinden (admin kredisinden) düşüyor mu?
3. ✅ Düşen miktar doğru mu?
4. ✅ Her iki kredi de aynı miktarda düşüyor mu?

## Notlar
- Test sırasında gerçek SMS gönderilecek (maliyetli olabilir)
- Kredileri mutlaka geri yükleyin
- Logları admin panelinden kontrol edebilirsiniz

