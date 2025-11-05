# 🔄 Supabase Client Migration Durumu

## ✅ Tamamlanan Route'lar

### Auth Routes (3/7)
- [x] `/api/auth/login` - Supabase client kullanıyor
- [x] `/api/auth/register` - Supabase client kullanıyor  
- [x] `/api/auth/profile` - Supabase client kullanıyor
- [ ] `/api/auth/change-password` - Prisma kullanıyor
- [ ] `/api/auth/enable-2fa` - Prisma kullanıyor
- [ ] `/api/auth/disable-2fa` - Prisma kullanıyor
- [ ] `/api/auth/verify-2fa` - Prisma kullanıyor

## ⏳ Kalan Route'lar (30+)

**Not:** Tüm route'ları Supabase client'a geçirmek için adım adım ilerliyoruz.

## 📋 Sonraki Adımlar

1. **Auth route'larını tamamla** (4 route kaldı)
2. **Contacts route'larını güncelle** (6 route)
3. **SMS route'larını güncelle** (4 route)
4. **Admin route'larını güncelle** (9 route)
5. **Payment route'larını güncelle** (6 route)
6. **Diğer route'ları güncelle** (refunds, templates, vb.)

## ⚠️ Önemli Notlar

- **Field Names**: Prisma `camelCase` → Supabase `snake_case` dönüşümü yapılmalı
- **Error Handling**: Supabase hataları `error` objesi içinde gelir
- **Relations**: Supabase'de `select` ile nested relations çekilebilir
- **Build**: Her route güncellendikten sonra build test edilmeli

## 🔍 Test

- Build başarılı: ✅
- Auth route'ları çalışıyor: ⏳ Test edilmeli

