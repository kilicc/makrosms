# DATABASE_URL Format Hatası Düzeltme

## Hata
```
Error: P1013
The provided database string is invalid. invalid port number in database URL.
```

## Çözüm

Supabase connection string formatı şu şekilde olmalıdır:

### Format 1: Direct Connection (Önerilen)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### Format 2: Pooled Connection (Alternatif)
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Format 3: Direct Connection (Basit)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

## Adımlar

1. Supabase Dashboard'a gidin
2. **Settings** > **Database** bölümüne gidin
3. **Connection string** bölümünden **URI** formatını kopyalayın
4. `[PASSWORD]` kısmını gerçek şifrenizle değiştirin
5. `.env` dosyasındaki `DATABASE_URL` değerini güncelleyin

## Örnek

Eğer Supabase connection string'iniz şöyleyse:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
```

`.env` dosyasında şöyle olmalı:
```env
DATABASE_URL=postgresql://postgres:gerçek_şifreniz@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Önemli:** Şifrede özel karakterler varsa URL encode edilmelidir:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- vb.

## Kontrol

Düzeltmeden sonra:
```bash
npx prisma db pull
```

Bu komut başarılı olmalıdır.

