# 🚀 TAM MİGRASYON REHBERİ - BİREBİR AKTARIM

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Dosya Yapısı](#dosya-yapısı)
3. [Tüm Özellikler](#tüm-özellikler)
4. [Tüm API Endpoint'leri](#tüm-api-endpointleri)
5. [Frontend Component'leri](#frontend-componentleri)
6. [Veritabanı Şeması](#veritabanı-şeması)
7. [Environment Variables](#environment-variables)
8. [Bağımlılıklar](#bağımlılıklar)
9. [Kurulum Adımları](#kurulum-adımları)
10. [Kopyalama Rehberi](#kopyalama-rehberi)

---

## 🎯 Proje Genel Bakış

**Proje Adı**: Advanced SMS Verification System  
**Versiyon**: 1.0.0  
**Backend**: Node.js + Express  
**Frontend**: React + TypeScript + Material-UI  
**Veritabanı**: Supabase (PostgreSQL)  
**SMS Provider**: CepSMS  
**Ödeme**: Kripto Para (Bitcoin, Ethereum, USDT, USDC, TRX)  

### Teknoloji Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: React 19, TypeScript, Material-UI v7
- **Veritabanı**: Supabase (PostgreSQL)
- **Authentication**: JWT, bcrypt
- **2FA**: speakeasy (TOTP)
- **SMS**: CepSMS API
- **Ödeme**: CoinMarketCap API, QR Code
- **Logging**: Winston
- **Email**: Nodemailer

---

## 📁 Dosya Yapısı

### Backend Yapısı

```
/
├── server.js                    # Ana sunucu dosyası
├── package.json                 # Backend bağımlılıkları
├── .env                         # Environment variables
├── env.example                  # Environment variables örneği
├── Dockerfile                    # Docker image
├── middleware/                  # Middleware'ler
│   ├── auth.js                  # JWT authentication middleware
│   └── errorHandler.js          # Global error handler
├── models/                      # Supabase modelleri
│   ├── SupabaseUser.js          # Kullanıcı modeli
│   ├── SupabaseContact.js       # Kişi modeli
│   ├── SupabaseContactGroup.js  # Grup modeli
│   ├── SupabaseSmsMessage.js    # SMS mesaj modeli
│   ├── SupabaseSmsTemplate.js   # SMS şablon modeli
│   └── SupabaseRefund.js        # İade modeli
├── routes/                      # API route'ları
│   ├── supabaseAuth.js          # Authentication routes
│   ├── supabaseContacts.js      # Kişi yönetimi routes
│   ├── supabaseContactGroups.js # Grup yönetimi routes
│   ├── supabaseBulkSMS.js       # Toplu SMS routes
│   ├── supabaseSmsTemplates.js  # SMS şablon routes
│   ├── payment.js               # Ödeme routes
│   ├── refunds.js               # İade routes
│   └── admin.js                 # Admin routes
├── utils/                       # Utility fonksiyonları
│   ├── supabase.js              # Supabase client
│   ├── cepSMSProvider.js        # CepSMS API entegrasyonu
│   ├── cryptoPayment.js         # Kripto ödeme logic
│   ├── payment.js               # Ödeme utility
│   ├── 2fa.js                   # 2FA utility
│   ├── email.js                 # Email utility
│   ├── logger.js                # Winston logger
│   ├── smsProvider.js           # SMS provider utility
│   └── webhook.js               # Webhook utility
├── logs/                        # Log dosyaları
│   ├── combined.log             # Tüm loglar
│   └── error.log                # Hata logları
└── supabase_setup.sql           # Supabase veritabanı şeması
```

### Frontend Yapısı

```
client/
├── package.json                 # Frontend bağımlılıkları
├── tsconfig.json                # TypeScript config
├── public/                      # Public dosyalar
│   ├── index.html               # Ana HTML
│   ├── logo3.png                # Logo dosyası
│   └── manifest.json            # PWA manifest
├── src/
│   ├── index.tsx                # React entry point
│   ├── App.tsx                  # Ana App component
│   ├── App.css                  # App CSS
│   ├── index.css                # Global CSS
│   ├── components/              # Reusable component'ler
│   │   ├── Navbar.tsx           # Sidebar navigation
│   │   ├── ProtectedRoute.tsx   # Route guard
│   │   └── CepSMSInterface.tsx  # SMS gönderim interface
│   ├── pages/                   # Sayfa component'leri
│   │   ├── Login.tsx            # Giriş sayfası
│   │   ├── Register.tsx         # Kayıt sayfası
│   │   ├── Dashboard.tsx        # Dashboard
│   │   ├── SMSInterface.tsx     # SMS gönderim sayfası
│   │   ├── AdvancedSMS.tsx      # Gelişmiş SMS sayfası
│   │   ├── Contacts.tsx         # Kişi yönetimi
│   │   ├── CryptoPayment.tsx    # Kripto ödeme
│   │   ├── Profile.tsx           # Profil ayarları
│   │   ├── AdminDashboard.tsx   # Admin paneli
│   │   ├── SMSReports.tsx       # SMS raporları
│   │   └── Refunds.tsx          # İade yönetimi
│   ├── hooks/                   # Custom hooks
│   │   └── useAuth.tsx          # Authentication hook
│   └── utils/                   # Frontend utilities
│       └── supabase.ts          # Supabase client (frontend)
```

---

## ✨ Tüm Özellikler

### 1. Kullanıcı Yönetimi
- ✅ Kullanıcı kaydı (username, email, password)
- ✅ Kullanıcı girişi (JWT token)
- ✅ Token yenileme (refresh token)
- ✅ Profil güncelleme
- ✅ Şifre değiştirme
- ✅ 2FA (Two-Factor Authentication)
- ✅ Kredi sistemi (SMS kredisi)
- ✅ Kullanıcı rolleri (user, admin, moderator)

### 2. Kişi Yönetimi (Contacts)
- ✅ Kişi ekleme (name, phone, email, notes, tags)
- ✅ Kişi listeleme (pagination, search, filter)
- ✅ Kişi güncelleme
- ✅ Kişi silme
- ✅ Kişi engelleme/engeli kaldırma
- ✅ Kişi arama (name, phone, email)
- ✅ Toplu kişi import
- ✅ Kişi istatistikleri

### 3. Grup Yönetimi (Contact Groups)
- ✅ Grup oluşturma
- ✅ Grup listeleme
- ✅ Grup güncelleme
- ✅ Grup silme
- ✅ Varsayılan grup ayarlama
- ✅ Grup aktif/pasif yapma
- ✅ Grup içindeki kişileri listeleme
- ✅ Grup istatistikleri
- ✅ Otomatik grup oluşturma (varsayılan)

### 4. SMS Gönderimi
- ✅ Tek SMS gönderimi
- ✅ Toplu SMS gönderimi (grup bazlı)
- ✅ Zamanlanmış SMS gönderimi
- ✅ SMS şablonları
- ✅ SMS geçmişi
- ✅ SMS durumu takibi
- ✅ SMS kredi kontrolü
- ✅ Otomatik kredi düşme (1 SMS = 1 kredi)

### 5. SMS Şablonları
- ✅ Şablon oluşturma
- ✅ Şablon listeleme
- ✅ Şablon güncelleme
- ✅ Şablon silme
- ✅ Şablon kopyalama
- ✅ Şablon arama
- ✅ Popüler şablonlar
- ✅ Şablon kullanım sayısı
- ✅ Şablon kategorileri

### 6. Kripto Ödeme
- ✅ Bitcoin (BTC) ödeme
- ✅ Ethereum (ETH) ödeme
- ✅ USDT (Tether) ödeme
- ✅ USDC (USD Coin) ödeme
- ✅ TRX (Tron) ödeme
- ✅ QR kod oluşturma
- ✅ Cüzdan adresi oluşturma
- ✅ Ödeme durumu takibi
- ✅ Otomatik kredi yükleme
- ✅ Kripto fiyat sorgulama (CoinMarketCap)
- ✅ Ödeme paketleri (Starter, Pro, Premium)

### 7. İade Yönetimi (Refunds)
- ✅ İade talebi oluşturma
- ✅ İade geçmişi
- ✅ İade durumu takibi
- ✅ Otomatik iade işleme (24 saat sonra)
- ✅ İade istatistikleri

### 8. Admin Paneli
- ✅ Tüm kullanıcıları listeleme
- ✅ Kullanıcı detayları
- ✅ Kullanıcı kredi yükleme
- ✅ SMS geçmişi görüntüleme
- ✅ Ödeme geçmişi görüntüleme
- ✅ Sistem istatistikleri
- ✅ Ayarlar yönetimi
- ✅ Ödeme onaylama

### 9. Real-time Özellikler
- ✅ Socket.IO entegrasyonu
- ✅ Real-time SMS durumu güncellemeleri
- ✅ Real-time kredi güncellemeleri

### 10. Güvenlik Özellikleri
- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ 2FA (TOTP)
- ✅ Rate limiting (opsiyonel)
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection koruması (Supabase)
- ✅ XSS koruması

### 11. Logging ve Monitoring
- ✅ Winston logger
- ✅ Error logging
- ✅ Request logging (Morgan)
- ✅ Log dosyaları (combined.log, error.log)

---

## 🔌 Tüm API Endpoint'leri

### Authentication (`/api/supabase-auth`)

#### POST `/register`
Kullanıcı kaydı

**Request Body:**
```json
{
  "username": "kullanici_adi",
  "email": "email@example.com",
  "password": "GüçlüŞifre123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "data": {
    "user": {
      "id": "uuid",
      "username": "kullanici_adi",
      "email": "email@example.com",
      "credit": 0,
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

#### POST `/login`
Kullanıcı girişi

**Request Body:**
```json
{
  "login": "kullanici_adi veya email",
  "password": "Şifre123!",
  "twoFactorCode": "123456"  // Opsiyonel, 2FA aktifse gerekli
}
```

#### POST `/refresh`
Token yenileme

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

#### POST `/logout`
Çıkış yapma

#### PUT `/profile`
Profil güncelleme (Auth Required)

**Request Body:**
```json
{
  "email": "yeni@email.com",
  "username": "yeni_kullanici_adi"
}
```

#### PUT `/change-password`
Şifre değiştirme (Auth Required)

**Request Body:**
```json
{
  "currentPassword": "EskiŞifre123!",
  "newPassword": "YeniŞifre123!"
}
```

#### POST `/enable-2fa`
2FA etkinleştirme (Auth Required)

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,..."
  }
}
```

#### POST `/disable-2fa`
2FA devre dışı bırakma (Auth Required)

**Request Body:**
```json
{
  "twoFactorCode": "123456",
  "password": "Şifre123!"
}
```

#### GET `/profile`
Profil bilgisi (Auth Required)

---

### Contacts (`/api/contacts`)

#### GET `/`
Kişi listesi (Auth Required)

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 50)
- `group`: Grup ID'si (filter)
- `search`: Arama terimi (name, phone, email)
- `isActive`: Aktif kayıtlar (true/false/null)
- `isBlocked`: Engellenmiş kayıtlar (true/false/null)

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

#### POST `/`
Kişi ekleme (Auth Required)

**Request Body:**
```json
{
  "name": "Ahmet Yılmaz",
  "phone": "905075708797",  // 90xxxxxxxxx formatında
  "email": "ahmet@example.com",  // Opsiyonel
  "notes": "Notlar",  // Opsiyonel
  "tags": ["tag1", "tag2"],  // Opsiyonel
  "groupId": "uuid"  // Opsiyonel
}
```

#### PUT `/:id`
Kişi güncelleme (Auth Required)

#### DELETE `/:id`
Kişi silme (Auth Required)

#### GET `/search`
Kişi arama (Auth Required)

**Query Parameters:**
- `q`: Arama terimi
- `limit`: Sonuç sayısı (default: 10)

#### PATCH `/:id/toggle-block`
Kişi engelleme/engeli kaldırma (Auth Required)

#### GET `/stats`
Kişi istatistikleri (Auth Required)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalContacts": 100,
    "activeContacts": 95,
    "blockedContacts": 5,
    "contactsByGroup": {...}
  }
}
```

#### POST `/import`
Toplu kişi import (Auth Required)

**Request Body:**
```json
{
  "contacts": [
    {
      "name": "Kişi 1",
      "phone": "905075708797",
      "email": "email1@example.com"
    },
    {
      "name": "Kişi 2",
      "phone": "905075708798",
      "email": "email2@example.com"
    }
  ],
  "groupId": "uuid"  // Opsiyonel
}
```

---

### Contact Groups (`/api/contact-groups`)

#### GET `/`
Grup listesi (Auth Required)

#### POST `/`
Grup oluşturma (Auth Required)

**Request Body:**
```json
{
  "name": "Grup Adı",
  "description": "Grup açıklaması",
  "color": "#1976d2",
  "icon": "group"
}
```

#### PUT `/:id`
Grup güncelleme (Auth Required)

#### DELETE `/:id`
Grup silme (Auth Required)

#### GET `/:id/contacts`
Grup içindeki kişiler (Auth Required)

#### PATCH `/:id/set-default`
Varsayılan grup yapma (Auth Required)

#### PATCH `/:id/toggle-active`
Grup aktif/pasif yapma (Auth Required)

#### GET `/stats`
Grup istatistikleri (Auth Required)

#### POST `/create-default`
Varsayılan grup oluşturma (Auth Required)

---

### Bulk SMS (`/api/bulk-sms`)

#### POST `/send-bulk`
Toplu SMS gönderimi (Auth Required)

**Request Body:**
```json
{
  "contactIds": ["uuid1", "uuid2", "uuid3"],
  "message": "SMS mesajı",
  "templateId": "uuid",  // Opsiyonel
  "sender": "Gönderen Adı"  // Opsiyonel
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 3,
    "failed": 0,
    "totalCost": 3,
    "messageIds": ["uuid1", "uuid2", "uuid3"]
  }
}
```

#### POST `/send-scheduled`
Zamanlanmış SMS gönderimi (Auth Required)

**Request Body:**
```json
{
  "contactIds": ["uuid1", "uuid2"],
  "message": "SMS mesajı",
  "scheduledAt": "2025-01-01T12:00:00Z"
}
```

#### GET `/status/:messageId`
SMS durumu (Auth Required)

#### GET `/history`
SMS geçmişi (Auth Required)

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına kayıt
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi
- `status`: Durum filtresi (sent, failed, pending)

---

### SMS Templates (`/api/sms-templates`)

#### GET `/`
Şablon listesi (Auth Required)

#### POST `/`
Şablon oluşturma (Auth Required)

**Request Body:**
```json
{
  "name": "Şablon Adı",
  "content": "Merhaba {{name}}, doğrulama kodunuz: {{code}}",
  "category": "Genel",
  "variables": ["name", "code"]
}
```

#### PUT `/:id`
Şablon güncelleme (Auth Required)

#### DELETE `/:id`
Şablon silme (Auth Required)

#### POST `/:id/duplicate`
Şablon kopyalama (Auth Required)

#### GET `/search`
Şablon arama (Auth Required)

**Query Parameters:**
- `q`: Arama terimi
- `category`: Kategori filtresi

#### GET `/popular`
Popüler şablonlar (Auth Required)

#### GET `/stats`
Şablon istatistikleri (Auth Required)

#### PATCH `/:id/use`
Şablon kullanım sayısı artırma (Auth Required)

---

### Payment (`/api/payment`)

#### GET `/packages`
Kredi paketleri

**Response:**
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "starter",
        "name": "Başlangıç Paketi",
        "credits": 1000,
        "price": 1500,
        "currency": "TRY",
        "bonus": 100
      }
    ]
  }
}
```

#### GET `/crypto-currencies`
Desteklenen kripto paralar

**Response:**
```json
{
  "success": true,
  "data": {
    "currencies": [
      {
        "symbol": "BTC",
        "name": "Bitcoin",
        "decimals": 8,
        "minAmount": 0.0001,
        "networkFee": 0.0001,
        "confirmations": 3
      }
    ]
  }
}
```

#### GET `/crypto-price/:currency`
Kripto fiyatı

**Query Parameters:**
- `fiat`: Fiat para birimi (TRY, USD)

#### POST `/crypto-create`
Kripto ödeme oluşturma (Auth Required)

**Request Body:**
```json
{
  "packageId": "starter",
  "cryptoCurrency": "BTC",
  "fiatAmount": 1500,
  "fiatCurrency": "TRY"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "hex-string",
    "currency": "BTC",
    "cryptoAmount": 0.00005263,
    "fiatAmount": 1500,
    "walletAddress": "TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5",
    "qrCodeData": "TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5",
    "expiresAt": "2025-01-01T12:00:00Z",
    "credits": 1000,
    "bonus": 100,
    "totalCredits": 1100
  }
}
```

#### GET `/crypto-status/:paymentId`
Ödeme durumu (Auth Required)

#### GET `/my-payments`
Ödeme geçmişi (Auth Required)

#### POST `/verify-transaction`
Ödeme doğrulama (Auth Required)

---

### Refunds (`/api/refunds`)

#### GET `/`
İade geçmişi (Auth Required)

#### POST `/process`
İade işleme (Auth Required)

**Request Body:**
```json
{
  "smsId": "uuid",
  "reason": "SMS iletilemedi"
}
```

#### GET `/stats`
İade istatistikleri (Auth Required)

---

### Admin (`/api/admin`)

#### GET `/stats`
Sistem istatistikleri (Auth Required + Admin)

#### GET `/users`
Tüm kullanıcılar (Auth Required + Admin)

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına kayıt
- `search`: Arama terimi
- `role`: Rol filtresi

#### GET `/users/:userId`
Kullanıcı detayları (Auth Required + Admin)

#### POST `/users/:userId/credit`
Kredi yükleme (Auth Required + Admin)

**Request Body:**
```json
{
  "amount": 1000,
  "reason": "Admin kredi yükleme"
}
```

#### GET `/sms-history`
SMS geçmişi (Auth Required + Admin)

#### GET `/payment-history`
Ödeme geçmişi (Auth Required + Admin)

#### GET `/settings`
Sistem ayarları (Auth Required + Admin)

#### PUT `/settings`
Sistem ayarları güncelleme (Auth Required + Admin)

#### GET `/pending-verifications`
Bekleyen ödeme onayları (Auth Required + Admin)

#### POST `/approve-verification/:paymentId`
Ödeme onaylama (Auth Required + Admin)

#### POST `/reject-verification/:paymentId`
Ödeme reddetme (Auth Required + Admin)

---

### Health Check

#### GET `/health`
Health check

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T12:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

#### GET `/api/health`
API health check

---

## 🎨 Frontend Component'leri

### Pages

#### Login.tsx
- Kullanıcı girişi formu
- Logo gösterimi
- Özellik kartları
- Hata mesajları
- Form validation (yup + react-hook-form)

#### Register.tsx
- Kullanıcı kayıt formu
- Form validation
- Şifre güçlülük kontrolü
- Başarı mesajları

#### Dashboard.tsx
- İstatistik kartları (kredi, SMS sayısı, kişi sayısı, hata sayısı)
- Son aktiviteler
- Ödeme geçmişi
- Hızlı aksiyonlar
- Real-time güncellemeler

#### SMSInterface.tsx
- SMS gönderim formu
- Servis seçimi (WhatsApp, Telegram, Instagram, vb.)
- Telefon numarası girişi
- Mesaj yazma
- Son SMS geçmişi

#### AdvancedSMS.tsx
- Grup/kişi seçimi
- Mesaj yazma
- Şablon seçimi ve kullanımı
- Toplu SMS gönderimi
- Gönderim sonuçları

#### Contacts.tsx
- Kişi listesi (tabs: Kişiler, Gruplar)
- Kişi ekleme/düzenleme/silme
- Grup yönetimi
- Arama ve filtreleme
- Toplu işlemler (grup atama)

#### CryptoPayment.tsx
- Kredi paketleri
- Kripto para seçimi
- QR kod gösterimi
- Cüzdan adresi
- Ödeme durumu takibi

#### Profile.tsx
- Profil bilgileri
- Şifre değiştirme
- 2FA ayarları
- Email güncelleme

#### AdminDashboard.tsx
- Sistem istatistikleri
- Kullanıcı yönetimi
- Kredi yükleme
- SMS geçmişi
- Ödeme geçmişi

#### SMSReports.tsx
- SMS raporları
- Filtreleme (tarih, durum)
- İstatistikler

#### Refunds.tsx
- İade talepleri
- İade geçmişi
- İade durumu

### Components

#### Navbar.tsx
- Sidebar navigation
- Logo gösterimi
- Kullanıcı bilgileri
- Menü öğeleri
- Çıkış butonu
- Responsive (mobile drawer)

#### ProtectedRoute.tsx
- Route guard
- Authentication kontrolü
- Redirect logic

#### CepSMSInterface.tsx
- SMS gönderim interface
- CepSMS API entegrasyonu

### Hooks

#### useAuth.tsx
- Authentication state management
- Login/logout functions
- Token management
- API client (axios instance)

---

## 🗄️ Veritabanı Şeması

### Supabase Tabloları

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  credit INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### contact_groups
```sql
CREATE TABLE contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#1976d2',
  icon VARCHAR(50) DEFAULT 'group',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

#### contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES contact_groups(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  last_contacted TIMESTAMP WITH TIME ZONE,
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone)
);
```

#### sms_messages
```sql
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent',
  cost DECIMAL(10,2) DEFAULT 0,
  service_name VARCHAR(50),
  service_code VARCHAR(20),
  service_url TEXT,
  cep_sms_message_id VARCHAR(100),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refund_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### refunds
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sms_id UUID REFERENCES sms_messages(id) ON DELETE CASCADE,
  original_cost DECIMAL(10,2) NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  hours_waited DECIMAL(5,1),
  remaining_hours DECIMAL(5,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

#### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

#### sms_templates
```sql
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'Genel',
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

### Indexler

```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_group_id ON contacts(group_id);
CREATE INDEX idx_contact_groups_user_id ON contact_groups(user_id);
CREATE INDEX idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX idx_sms_messages_phone ON sms_messages(phone_number);
CREATE INDEX idx_sms_messages_status ON sms_messages(status);
CREATE INDEX idx_sms_messages_sent_at ON sms_messages(sent_at);
```

### RLS Policies

Tüm tablolar için Row Level Security (RLS) aktif ve kullanıcılar sadece kendi verilerine erişebilir.

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://ercvagagcdkpsuuygluu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# CepSMS API Configuration
CEPSMS_USERNAME=your_cepsms_username
CEPSMS_PASSWORD=your_cepsms_password
CEPSMS_FROM=CepSMS

# CoinMarketCap API Configuration
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Cold Wallet Configuration
COLD_WALLET_BTC=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_ETH=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_USDT=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_USDC=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_TRX=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Security
BCRYPT_ROUNDS=12

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### Frontend Environment

Frontend için `.env` dosyası gerekli değil, tüm API URL'leri `useAuth.tsx` hook'unda tanımlı.

---

## 📦 Bağımlılıklar

### Backend (package.json)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.77.0",
    "axios": "^1.5.0",
    "bcrypt": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^6.10.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "moment": "^2.29.4",
    "mongoose": "^7.5.0",
    "morgan": "^1.10.0",
    "nodemailer": "^6.9.4",
    "qrcode": "^1.5.3",
    "redis": "^4.6.7",
    "socket.io": "^4.7.2",
    "speakeasy": "^2.0.0",
    "uuid": "^9.0.0",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Frontend (client/package.json)

```json
{
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@hookform/resolvers": "^5.2.2",
    "@mui/icons-material": "^7.3.4",
    "@mui/lab": "^7.0.1-beta.18",
    "@mui/material": "^7.3.4",
    "@mui/x-date-pickers": "^8.15.0",
    "@supabase/supabase-js": "^2.77.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.5.2",
    "@types/node": "^16.18.126",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "@types/react-router-dom": "^5.3.3",
    "@types/socket.io-client": "^1.4.36",
    "axios": "^1.13.0",
    "date-fns": "^4.1.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.65.0",
    "react-qr-code": "^2.0.18",
    "react-router-dom": "^7.9.4",
    "react-scripts": "5.0.1",
    "socket.io-client": "^4.8.1",
    "typescript": "^4.9.5",
    "web-vitals": "^2.1.4",
    "yup": "^1.7.1"
  }
}
```

---

## 🚀 Kurulum Adımları

### 1. Proje Klonlama

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Backend Kurulumu

```bash
# Bağımlılıkları yükle
npm install

# Environment variables dosyası oluştur
cp env.example .env

# .env dosyasını düzenle
nano .env
```

### 3. Supabase Kurulumu

1. Supabase projesi oluştur
2. SQL Editor'de `supabase_setup.sql` dosyasını çalıştır
3. Supabase URL ve API key'lerini `.env` dosyasına ekle

### 4. Frontend Kurulumu

```bash
cd client
npm install
```

### 5. Backend Başlatma

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Frontend Başlatma

```bash
# Yeni terminal
cd client
npm start
```

### 7. Veritabanı Migration

Supabase SQL Editor'de `supabase_setup.sql` dosyasını çalıştırın.

---

## 📋 Kopyalama Rehberi

### Adım 1: Dosya Yapısını Kopyala

1. Tüm backend dosyalarını kopyala:
   - `server.js`
   - `package.json`
   - `middleware/` klasörü
   - `models/` klasörü
   - `routes/` klasörü
   - `utils/` klasörü
   - `supabase_setup.sql`

2. Tüm frontend dosyalarını kopyala:
   - `client/` klasörünün tamamı

### Adım 2: Bağımlılıkları Yükle

```bash
# Backend
npm install

# Frontend
cd client
npm install
```

### Adım 3: Environment Variables

`.env` dosyasını oluştur ve tüm değerleri doldur:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
CEPSMS_USERNAME=...
CEPSMS_PASSWORD=...
COINMARKETCAP_API_KEY=...
...
```

### Adım 4: Supabase Kurulumu

1. Yeni Supabase projesi oluştur
2. `supabase_setup.sql` dosyasını SQL Editor'de çalıştır
3. Supabase URL ve key'lerini `.env` dosyasına ekle

### Adım 5: Logo ve Görseller

`client/public/logo3.png` dosyasını kopyala.

### Adım 6: Test

```bash
# Backend
npm start

# Frontend (yeni terminal)
cd client
npm start
```

### Adım 7: İlk Kullanıcı Oluştur

Supabase Dashboard'da veya `/api/supabase-auth/register` endpoint'i ile ilk kullanıcıyı oluştur.

---

## ✅ Checklist

Kopyalama işlemi tamamlandığında:

- [ ] Tüm backend dosyaları kopyalandı
- [ ] Tüm frontend dosyaları kopyalandı
- [ ] `npm install` backend'de çalıştırıldı
- [ ] `npm install` frontend'de çalıştırıldı
- [ ] `.env` dosyası oluşturuldu ve dolduruldu
- [ ] Supabase projesi oluşturuldu
- [ ] `supabase_setup.sql` çalıştırıldı
- [ ] Backend başlatıldı ve çalışıyor
- [ ] Frontend başlatıldı ve çalışıyor
- [ ] İlk kullanıcı oluşturuldu
- [ ] Login işlemi test edildi
- [ ] SMS gönderimi test edildi
- [ ] Ödeme sistemi test edildi

---

## 🔧 Önemli Notlar

1. **Supabase URL ve Key'ler**: `utils/supabase.js` dosyasında hardcoded olabilir, yeni projede `.env`'den alınmalı.

2. **CepSMS API**: SMS gönderimi için CepSMS API hesabı gerekli.

3. **CoinMarketCap API**: Kripto fiyatları için CoinMarketCap API key gerekli.

4. **Cold Wallet**: Tüm kripto ödemeler için aynı TRX adresi kullanılıyor (TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5).

5. **JWT Secret**: Güçlü bir JWT secret kullanın.

6. **bcrypt Rounds**: Şifre hash'leme için 12 round kullanılıyor.

7. **Port**: Backend varsayılan port 3001, frontend 3000.

---

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin (`logs/combined.log`, `logs/error.log`)
2. Supabase Dashboard'da tabloları kontrol edin
3. Environment variables'ları kontrol edin
4. API endpoint'lerini test edin (Postman veya curl)

---

**Bu rehberi takip ederek tüm özellikleri, fonksiyonları ve işlevselliği birebir kopyalayabilirsiniz!**

