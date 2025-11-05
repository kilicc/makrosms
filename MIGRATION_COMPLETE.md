# ⚠️ Supabase Client Migration - Büyük Güncelleme Devam Ediyor

## 📋 Durum

**33+ API route dosyası** Supabase client'a çevrilmeli. Bu çok büyük bir iş ve adım adım yapılıyor.

## ✅ Tamamlanan

- Auth routes (7/7) ✓
  - login
  - register
  - profile
  - change-password
  - enable-2fa
  - disable-2fa
  - verify-2fa

- Contacts routes (1/6) ⏳
  - contacts/route.ts (GET, POST) ✓
  - contacts/[id]/route.ts (PUT, DELETE) - Güncelleniyor
  - contacts/search/route.ts - Bekliyor
  - contacts/stats/route.ts - Bekliyor
  - contacts/[id]/toggle-block/route.ts - Bekliyor
  - contacts/import/route.ts - Bekliyor

## ⏳ Kalan Route'lar

- Contact Groups (3 route)
- SMS (4 route)
- SMS Templates (2 route)
- Payment (5 route)
- Payment Requests (4 route)
- Admin (9 route)
- Refunds (2 route)
- Bulk SMS (3 route)

## ⚠️ Önemli Notlar

1. **Field Name Mapping**: Prisma `camelCase` → Supabase `snake_case`
2. **Error Handling**: Supabase hataları `error` objesi içinde
3. **Relations**: Supabase'de `select` ile nested relations
4. **Search**: Case-insensitive için `.ilike()` kullanılmalı
5. **Count**: Supabase'de `count: 'exact'` parametresi gerekli

## 🔄 Migration Stratejisi

Her route grubu güncellendikten sonra:
1. Build test edilmeli
2. Commit yapılmalı
3. Sonraki gruba geçilmeli

## 📝 İlerleme

- Auth routes: %100 ✓
- Contacts routes: %17 (1/6) ⏳
- Toplam: ~%10 tamamlandı

