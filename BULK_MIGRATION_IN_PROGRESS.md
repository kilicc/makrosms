# ⚠️ Supabase Client Migration - Büyük Güncelleme Devam Ediyor

## 📋 Durum

**33 API route dosyası** Supabase client'a çevrilmeli.

## ✅ Tamamlanan

- Auth routes (7/7) ✓
  - login
  - register
  - profile
  - change-password
  - enable-2fa
  - disable-2fa
  - verify-2fa

## ⏳ Devam Eden

Şu anda tüm route'ları adım adım güncelliyorum. Bu büyük bir iş ve zaman alacak.

## 📝 Yapılacaklar

1. Contacts routes (6 route)
2. Contact Groups routes (3 route)
3. SMS routes (4 route)
4. SMS Templates routes (2 route)
5. Payment routes (5 route)
6. Payment Requests routes (4 route)
7. Admin routes (9 route)
8. Refunds routes (2 route)

**Toplam: ~35 route dosyası**

## ⚠️ Önemli

- Bu migration çok büyük bir değişiklik
- Tüm route'lar test edilmeli
- Field name mapping (camelCase → snake_case) yapılmalı
- Error handling Supabase'e göre güncellenmeli

## 🔄 Commit Stratejisi

Her route grubu güncellendikten sonra commit yapılacak.

