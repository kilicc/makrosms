# 📚 SMS Doğrulama Sistemi - Kapsamlı Proje Dokümantasyonu

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Teknoloji Stack](#teknoloji-stack)
4. [Dosya Yapısı](#dosya-yapısı)
5. [Veritabanı Şeması](#veritabanı-şeması)
6. [API Endpoints](#api-endpoints)
7. [Backend Detayları](#backend-detayları)
8. [Frontend Detayları](#frontend-detayları)
9. [Güvenlik](#güvenlik)
10. [SMS Provider Entegrasyonu](#sms-provider-entegrasyonu)
11. [Kripto Ödeme Sistemi](#kripto-ödeme-sistemi)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)
14. [Kullanım Senaryoları](#kullanım-senaryoları)

---

## 🎯 Proje Genel Bakış

### Proje Adı
**Advanced SMS Verification System** - Gelişmiş SMS Doğrulama Sistemi

### Açıklama
Modern, güvenli ve API tabanlı SMS doğrulama sistemi. Supabase veritabanı, CepSMS entegrasyonu, kripto para ödeme sistemi ve gelişmiş güvenlik özellikleri ile donatılmış full-stack bir web uygulamasıdır.

### Ana Özellikler
- ✅ **Kullanıcı Yönetimi**: Kayıt, giriş, profil yönetimi, 2FA desteği
- ✅ **SMS Gönderimi**: Toplu SMS, grup SMS, şablon desteği
- ✅ **Rehber Yönetimi**: Kişi ve grup yönetimi, import/export
- ✅ **Kripto Ödeme**: BTC, ETH, USDT, USDC, TRX desteği
- ✅ **Raporlama**: SMS geçmişi, istatistikler, analiz
- ✅ **İade Sistemi**: Başarısız SMS iadeleri
- ✅ **Admin Panel**: Kullanıcı yönetimi, sistem yönetimi

---

## 🏗️ Mimari Yapı

### Genel Mimari
```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                       │
│  - React 19.2.0                                         │
│  - TypeScript                                           │
│  - Material-UI                                         │
│  - React Router                                         │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST API
                   │ JWT Authentication
┌──────────────────┴──────────────────────────────────────┐
│                  SERVER (Node.js)                       │
│  - Express.js 4.18.2                                     │
│  - Socket.IO                                             │
│  - JWT Authentication                                    │
│  - Rate Limiting                                         │
└──────────────────┬──────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
┌──────┴──────┐      ┌─────────┴──────────┐
│  Supabase   │      │   CepSMS API       │
│  PostgreSQL │      │   SMS Provider     │
└─────────────┘      └────────────────────┘
```

### Tek Katmanlı Mimari
- **Frontend**: React SPA (Single Page Application)
- **Backend**: RESTful API (Express.js)
- **Database**: Supabase (PostgreSQL)
- **SMS Provider**: CepSMS API
- **Payment**: Kripto para ödeme sistemi

---

## 🛠️ Teknoloji Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **2FA**: speakeasy 2.0.0
- **Logging**: winston 3.10.0
- **HTTP Client**: axios 1.5.0
- **Real-time**: socket.io 4.7.2
- **Security**: helmet 7.0.0, cors 2.8.5
- **Validation**: express-validator 7.0.1

### Frontend
- **Framework**: React 19.2.0
- **Language**: TypeScript 4.9.5
- **UI Library**: Material-UI 7.3.4
- **Routing**: React Router DOM 7.9.4
- **HTTP Client**: axios 1.13.0
- **Form Handling**: react-hook-form 7.65.0, yup 1.7.1
- **State Management**: React Context API
- **Date Handling**: date-fns 4.1.0
- **QR Code**: react-qr-code 2.0.18

### Database
- **Primary**: Supabase (PostgreSQL)
- **Optional**: MongoDB (mongoose 7.5.0) - Optional, kullanılmıyor

---

## 📁 Dosya Yapısı

```
tttttttttttt/
├── client/                          # React Frontend
│   ├── public/                      # Static dosyalar
│   │   ├── logo3.png               # Logo
│   │   ├── index.html              # HTML template
│   │   └── manifest.json            # PWA manifest
│   ├── src/                         # Kaynak kodlar
│   │   ├── components/              # React bileşenleri
│   │   │   ├── Navbar.tsx           # Ana navigasyon
│   │   │   ├── ProtectedRoute.tsx   # Route koruma
│   │   │   └── CepSMSInterface.tsx  # SMS arayüzü
│   │   ├── pages/                   # Sayfa bileşenleri
│   │   │   ├── Login.tsx            # Giriş sayfası
│   │   │   ├── Register.tsx       # Kayıt sayfası
│   │   │   ├── Dashboard.tsx       # Ana sayfa
│   │   │   ├── AdvancedSMS.tsx     # Gelişmiş SMS
│   │   │   ├── Contacts.tsx        # Rehber yönetimi
│   │   │   ├── CryptoPayment.tsx   # Kripto ödeme
│   │   │   ├── Profile.tsx         # Profil
│   │   │   ├── AdminDashboard.tsx  # Admin panel
│   │   │   ├── SMSReports.tsx      # SMS raporları
│   │   │   └── Refunds.tsx         # İadeler
│   │   ├── hooks/                   # Custom hooks
│   │   │   └── useAuth.tsx         # Auth context
│   │   ├── utils/                   # Yardımcı fonksiyonlar
│   │   │   └── supabase.ts         # Supabase client
│   │   ├── App.tsx                  # Ana uygulama
│   │   └── index.tsx               # Entry point
│   ├── package.json                 # Frontend dependencies
│   └── tsconfig.json               # TypeScript config
│
├── routes/                          # API Route handlers
│   ├── supabaseAuth.js             # Authentication routes
│   ├── supabaseContacts.js         # Contact routes
│   ├── supabaseContactGroups.js    # Group routes
│   ├── supabaseBulkSMS.js         # Bulk SMS routes
│   ├── supabaseSmsTemplates.js    # Template routes
│   ├── payment.js                  # Payment routes
│   ├── refunds.js                 # Refund routes
│   └── admin.js                    # Admin routes
│
├── models/                         # Database models
│   ├── SupabaseUser.js            # User model
│   ├── SupabaseContact.js         # Contact model
│   ├── SupabaseContactGroup.js    # Group model
│   ├── SupabaseSmsMessage.js     # SMS message model
│   ├── SupabaseSmsTemplate.js     # Template model
│   └── SupabaseRefund.js          # Refund model
│
├── middleware/                     # Express middleware
│   ├── auth.js                     # JWT authentication
│   └── errorHandler.js            # Error handling
│
├── utils/                          # Utility functions
│   ├── supabase.js                # Supabase client config
│   ├── cepSMSProvider.js          # CepSMS integration
│   ├── cryptoPayment.js            # Crypto payment
│   ├── 2fa.js                      # 2FA utilities
│   ├── email.js                    # Email utilities
│   ├── logger.js                   # Winston logger
│   └── payment.js                  # Payment utilities
│
├── server.js                       # Express server
├── package.json                    # Backend dependencies
├── Dockerfile                      # Docker config
├── .dockerignore                   # Docker ignore
├── env.example                     # Environment variables example
├── supabase_setup.sql             # Database schema
├── DOCKPLOY_SETUP.md              # Deployment guide
└── README.md                      # Project README
```

---

## 🗄️ Veritabanı Şeması

### Supabase Tabloları

#### 1. `users` - Kullanıcılar
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  credit INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',  -- 'user', 'admin', 'moderator'
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Önemli Alanlar:**
- `credit`: SMS kredisi (INTEGER, her SMS 1 kredi)
- `role`: Kullanıcı rolü ('user', 'admin', 'moderator')
- `two_factor_enabled`: 2FA aktif mi?
- `two_factor_secret`: 2FA secret key

#### 2. `contacts` - Kişiler
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

**Önemli Alanlar:**
- `phone`: Telefon numarası (905xxxxxxxxx formatında)
- `is_blocked`: Kişi engellenmiş mi?
- `contact_count`: Bu kişiye kaç SMS gönderildi

#### 3. `contact_groups` - Gruplar
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

#### 4. `sms_messages` - SMS Mesajları
```sql
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent',  -- 'sent', 'delivered', 'failed'
  cost DECIMAL(10,2) DEFAULT 0,
  service_name VARCHAR(50),
  service_code VARCHAR(20),
  service_url TEXT,
  cep_sms_message_id VARCHAR(100),  -- CepSMS MessageID
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refund_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Önemli Alanlar:**
- `status`: SMS durumu ('sent', 'delivered', 'failed')
- `cost`: SMS maliyeti (1 kredi)
- `cep_sms_message_id`: CepSMS API'den dönen MessageID

#### 5. `sms_templates` - SMS Şablonları
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

#### 6. `refunds` - İadeler
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sms_id UUID REFERENCES sms_messages(id) ON DELETE CASCADE,
  original_cost DECIMAL(10,2) NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'processed'
  hours_waited DECIMAL(5,1),
  remaining_hours DECIMAL(5,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

#### 7. `payments` - Ödemeler
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes
```sql
-- Performance için önemli indexler
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX idx_sms_messages_status ON sms_messages(status);
CREATE INDEX idx_sms_messages_sent_at ON sms_messages(sent_at);
```

### Row Level Security (RLS)
Tüm tablolarda RLS aktif:
- Kullanıcılar sadece kendi verilerini görebilir
- Admin kullanıcılar tüm verileri görebilir

---

## 🔌 API Endpoints

### Authentication (`/api/supabase-auth`)

#### POST `/register` - Kullanıcı Kaydı
```json
Request:
{
  "username": "kullanici_adi",
  "email": "email@example.com",
  "password": "GüçlüŞifre123!",
  "phone": "+905551234567"
}

Response:
{
  "success": true,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    },
    "twoFactorSecret": "JBSWY3DPEHPK3PXP"
  }
}
```

#### POST `/login` - Giriş
```json
Request:
{
  "login": "kullanici_adi veya email",
  "password": "Şifre123!",
  "twoFactorCode": "123456"  // Opsiyonel, 2FA aktifse gerekli
}

Response:
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

#### GET `/profile` - Profil Bilgisi
**Auth Required**: `Bearer {token}`

#### PUT `/profile` - Profil Güncelleme
**Auth Required**: `Bearer {token}`

#### PUT `/change-password` - Şifre Değiştirme
**Auth Required**: `Bearer {token}`

#### POST `/enable-2fa` - 2FA Etkinleştir
**Auth Required**: `Bearer {token}`

#### POST `/disable-2fa` - 2FA Devre Dışı Bırak
**Auth Required**: `Bearer {token}`

---

### Contacts (`/api/contacts`)

#### GET `/contacts` - Kişileri Listele
**Auth Required**: `Bearer {token}`

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 50)
- `group`: Grup ID'si
- `search`: Arama terimi
- `isActive`: Aktif kayıtlar (true/false/null)
- `isBlocked`: Engellenmiş kayıtlar (true/false/null)

#### POST `/contacts` - Kişi Ekle
**Auth Required**: `Bearer {token}`

```json
Request:
{
  "name": "Ahmet Yılmaz",
  "phone": "905075708797",  // 90xxxxxxxxx formatında
  "email": "ahmet@example.com",  // Opsiyonel
  "notes": "Notlar",  // Opsiyonel
  "tags": ["tag1", "tag2"],  // Opsiyonel
  "groupId": "uuid"  // Opsiyonel
}
```

#### PUT `/contacts/:id` - Kişi Güncelle
**Auth Required**: `Bearer {token}`

#### DELETE `/contacts/:id` - Kişi Sil
**Auth Required**: `Bearer {token}`

#### GET `/contacts/:id` - Kişi Detayı
**Auth Required**: `Bearer {token}`

---

### Contact Groups (`/api/contact-groups`)

#### GET `/contact-groups` - Grupları Listele
**Auth Required**: `Bearer {token}`

#### POST `/contact-groups` - Grup Oluştur
**Auth Required**: `Bearer {token}`

```json
Request:
{
  "name": "Grup Adı",
  "description": "Açıklama",
  "color": "#1976d2",
  "icon": "group"
}
```

#### PUT `/contact-groups/:id` - Grup Güncelle
**Auth Required**: `Bearer {token}`

#### DELETE `/contact-groups/:id` - Grup Sil
**Auth Required**: `Bearer {token}`

---

### SMS Templates (`/api/sms-templates`)

#### GET `/sms-templates` - Şablonları Listele
**Auth Required**: `Bearer {token}`

#### POST `/sms-templates` - Şablon Oluştur
**Auth Required**: `Bearer {token}`

```json
Request:
{
  "name": "Şablon Adı",
  "content": "Merhaba {{name}}, bu bir test mesajıdır.",
  "category": "Genel",
  "variables": ["name"]
}
```

#### PUT `/sms-templates/:id` - Şablon Güncelle
**Auth Required**: `Bearer {token}`

#### DELETE `/sms-templates/:id` - Şablon Sil
**Auth Required**: `Bearer {token}`

---

### Bulk SMS (`/api/bulk-sms`)

#### POST `/send-bulk` - Toplu SMS Gönder
**Auth Required**: `Bearer {token}`

```json
Request:
{
  "contacts": ["contact-id-1", "contact-id-2"],  // Contact ID'leri
  "message": "SMS mesajı içeriği",
  "isScheduled": false,
  "scheduledDate": "2025-01-01",
  "scheduledTime": "10:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Toplu SMS gönderimi tamamlandı: 2 başarılı, 0 başarısız",
  "data": {
    "totalContacts": 2,
    "successCount": 2,
    "failedCount": 0,
    "totalCost": 2,
    "remainingCredit": 998,
    "messages": [
      {
        "contact": "Ahmet Yılmaz",
        "phone": "905075708797",
        "messageId": "uuid",
        "status": "sent"
      }
    ],
    "errors": []
  }
}
```

#### GET `/history` - SMS Geçmişi
**Auth Required**: `Bearer {token}`

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına kayıt
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi
- `status`: Durum filtresi

#### GET `/status/:messageId` - SMS Durumu
**Auth Required**: `Bearer {token}`

---

### Payment (`/api/payment`)

#### GET `/packages` - Kredi Paketleri
```json
Response:
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

#### GET `/crypto-currencies` - Desteklenen Kripto Paralar
```json
Response:
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

#### GET `/crypto-price/:currency` - Kripto Fiyatı
**Query Parameters:**
- `fiat`: Fiat para birimi (TRY, USD)

#### POST `/crypto-create` - Kripto Ödeme Oluştur
**Auth Required**: `Bearer {token}`

```json
Request:
{
  "packageId": "starter",
  "cryptoCurrency": "BTC",
  "fiatAmount": 1500,
  "fiatCurrency": "TRY"
}

Response:
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

#### GET `/crypto-status/:paymentId` - Ödeme Durumu
**Auth Required**: `Bearer {token}`

---

### Refunds (`/api/refunds`)

#### POST `/request` - İade Talebi
**Auth Required**: `Bearer {token}`

```json
Request:
{
  "smsId": "uuid",
  "reason": "SMS iletilemedi"
}
```

#### GET `/history` - İade Geçmişi
**Auth Required**: `Bearer {token}`

---

### Admin (`/api/admin`)

#### GET `/users` - Tüm Kullanıcılar
**Auth Required**: `Bearer {token}` + Admin role

#### GET `/stats` - Sistem İstatistikleri
**Auth Required**: `Bearer {token}` + Admin role

#### POST `/users/:id/credit` - Kredi Yükleme
**Auth Required**: `Bearer {token}` + Admin role

---

### Health Check

#### GET `/health` - Health Check
```json
Response:
{
  "status": "OK",
  "timestamp": "2025-01-01T12:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

#### GET `/api/health` - API Health Check
Aynı response formatı

---

## 🔧 Backend Detayları

### Server.js Yapısı

**Port**: `3001` (default) veya `process.env.PORT`

**Middleware Stack:**
1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Compression**: Response compression
4. **Morgan**: HTTP request logging
5. **Body Parser**: JSON ve URL-encoded body parsing
6. **Error Handler**: Global error handling

**Route Mounting:**
```javascript
app.use('/api/payment', authenticateToken, paymentRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/refunds', authenticateToken, refundsRoutes);
app.use('/api/contacts', authenticateToken, contactsRoutes);
app.use('/api/contact-groups', authenticateToken, groupsRoutes);
app.use('/api/sms-templates', authenticateToken, templatesRoutes);
app.use('/api/bulk-sms', authenticateToken, bulkSMSRoutes);
app.use('/api/supabase-auth', authRoutes);  // Auth gerektirmez
```

**Production Mode:**
- React build klasörü (`client/build`) static olarak serve edilir
- Tüm route'lar `client/build/index.html`'e yönlendirilir (SPA)

### Authentication Middleware

**Dosya**: `middleware/auth.js`

**`authenticateToken`**: JWT token doğrulama
```javascript
// Token formatı: Bearer {token}
// Token'da userId, username, role bilgileri var
// Token expired veya invalid ise 401 döner
```

**`requireAdmin`**: Admin yetkisi kontrolü
```javascript
// req.user.role === 'admin' veya 'moderator' olmalı
```

**`requireCredit`**: Kredi kontrolü
```javascript
// req.user.credit >= amount olmalı
```

### Model Yapısı

**Supabase Models**: `models/` klasöründe

**SupabaseUser.js**:
- `create(userData)`: Kullanıcı oluştur
- `findById(id)`: ID ile kullanıcı bul
- `findByLogin(login)`: Username veya email ile bul
- `update(id, updateData)`: Kullanıcı güncelle
- `updateCredit(id, credit)`: Kredi güncelle
- `updateLastLogin(id)`: Son giriş zamanı güncelle
- `verifyPassword(user, password)`: Şifre doğrula
- `usernameExists(username)`: Kullanıcı adı kontrolü
- `emailExists(email)`: Email kontrolü

**SupabaseContact.js**:
- `create(contactData)`: Kişi oluştur
- `getUserContacts(userId, options)`: Kullanıcının kişilerini getir
- `getContactsByIds(userId, ids)`: ID listesi ile kişileri getir
- `update(id, updateData)`: Kişi güncelle
- `delete(id)`: Kişi sil
- `updateLastContacted(contactId, userId)`: Son iletişim zamanı güncelle

**SupabaseSmsMessage.js**:
- `create(messageData)`: SMS kaydı oluştur
- `getUserMessages(userId, options)`: Kullanıcının SMS'lerini getir
- `getSMSStats(userId, startDate, endDate)`: İstatistikler

### SMS Provider Entegrasyonu

**Dosya**: `utils/cepSMSProvider.js`

**CepSMS API:**
- **URL**: `https://panel4.cepsms.com/smsapi`
- **Method**: POST
- **Content-Type**: `application/json`

**API Credentials:**
```javascript
// Environment variables:
CEPSMS_USERNAME="Testfn"
CEPSMS_PASSWORD="Qaswed"
CEPSMS_FROM="CepSMS"
```

**SMS Gönderme Formatı:**
```json
{
  "User": "Testfn",
  "Pass": "Qaswed",
  "Message": "SMS içeriği",
  "Numbers": ["905075708797"]
}
```

**Response Format:**
```json
{
  "Status": "OK",
  "MessageId": "68680164714"
}
```

**Telefon Numarası Formatı:**
- CepSMS için: `905xxxxxxxxx` formatında olmalı
- Sistem otomatik formatlar:
  - `+905xxxxxxxxx` → `905xxxxxxxxx`
  - `905xxxxxxxxx` → `905xxxxxxxxx`
  - `0xxxxxxxxxx` → `905xxxxxxxxx`
  - `xxxxxxxxxx` → `905xxxxxxxxx`

**Kredi Sistemi:**
- Her SMS: **1 kredi** düşer
- Kredi `Math.round()` ile tam sayıya yuvarlanır
- Floating point precision sorunları önlenir

---

## 🎨 Frontend Detayları

### App.tsx Yapısı

**Routing:**
```typescript
/ → /dashboard (redirect)
/dashboard → Dashboard
/login → Login
/register → Register
/sms → CepSMSInterface
/advanced-sms → AdvancedSMS
/contacts → Contacts
/payment → CryptoPayment
/profile → Profile
/admin → AdminDashboard (admin only)
/reports → SMSReports
/refunds → Refunds
```

**Protected Routes:**
- `ProtectedRoute` component'i ile korunur
- Token yoksa `/login`'e yönlendirilir
- Token expired ise logout yapılır

### Authentication (useAuth.tsx)

**Context API kullanımı:**
```typescript
const { user, login, logout, api } = useAuth();
```

**Token Storage:**
- `localStorage.setItem('accessToken', token)`
- `localStorage.setItem('refreshToken', token)`

**API Interceptor:**
- Her request'e `Authorization: Bearer {token}` header'ı eklenir
- 401 response'da otomatik logout

### Component Yapısı

**Navbar.tsx:**
- Responsive sidebar
- Logo: `logo3.png`
- Menü öğeleri: Dashboard, SMS, Rehber, vb.
- Kullanıcı bilgileri ve kredi gösterimi

**AdvancedSMS.tsx:**
- Grup/kişi seçimi
- Mesaj yazma
- Şablon yönetimi
- Toplu SMS gönderimi

**Contacts.tsx:**
- Kişi listesi
- Grup yönetimi
- Kişi ekleme/düzenleme/silme
- Bulk grup atama

**CryptoPayment.tsx:**
- Paket seçimi
- Kripto para seçimi
- QR kod gösterimi
- Ödeme durumu takibi

### API Client

**Base URL**: `http://localhost:3001/api` (development)

**Axios Instance:**
```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Request Interceptor:**
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🔒 Güvenlik

### Authentication

**JWT Token:**
- **Secret**: `process.env.JWT_SECRET`
- **Expire**: `7d` (default) veya `process.env.JWT_EXPIRE`
- **Algorithm**: HS256

**Token Payload:**
```json
{
  "userId": "uuid",
  "username": "kullanici_adi",
  "role": "user"
}
```

### Password Security

**Hashing:**
- **Algorithm**: bcrypt
- **Rounds**: 10 (default)
- **Library**: bcryptjs 2.4.3

**Password Requirements:**
- Minimum 8 karakter
- En az 1 küçük harf
- En az 1 büyük harf
- En az 1 rakam
- En az 1 özel karakter (@$!%*?&)

### 2FA (Two-Factor Authentication)

**Library**: speakeasy 2.0.0

**Secret Generation:**
- Base32 encoded secret
- QR kod ile Google Authenticator'a eklenir

**Verification:**
- TOTP (Time-based One-Time Password)
- Window: 2 adım tolerans

### API Security

**Helmet:**
- Content Security Policy
- XSS Protection
- MIME Sniffing Protection

**CORS:**
- Origin: `process.env.CLIENT_URL` veya `http://localhost:3000`
- Credentials: true

**Rate Limiting:**
- Şu anda **devre dışı** (commented out)
- Gelecekte aktif edilebilir

### Database Security

**Row Level Security (RLS):**
- Supabase'de tüm tablolarda aktif
- Kullanıcılar sadece kendi verilerini görebilir

**SQL Injection:**
- Supabase client parametrized queries kullanır
- SQL injection riski yok

---

## 📱 SMS Provider Entegrasyonu

### CepSMS API

**Base URL**: `https://panel4.cepsms.com/smsapi`

**Credentials:**
```javascript
Username: "Testfn"
Password: "Qaswed"
From: "CepSMS"
```

**SMS Gönderme:**
```javascript
const { sendSMS } = require('./utils/cepSMSProvider');

const result = await sendSMS('905075708797', 'Mesaj içeriği');
// Result: { success: true, messageId: "68680164714", ... }
```

**SMS Tipleri:**
1. **Simple SMS**: Basit SMS gönderimi
2. **Advanced SMS**: Gönderen adı, coding, validity period ile
3. **Multi SMS**: Her numaraya farklı mesaj

**Telefon Numarası Formatı:**
- CepSMS için: `905xxxxxxxxx` (11 haneli)
- Sistem otomatik formatlar:
  - `+905...` → `905...`
  - `90...` → `905...`
  - `0...` → `905...`
  - `5...` → `905...`

**Kredi Sistemi:**
- Her SMS: **1 kredi**
- Başarısız SMS'ler için kredi düşmez (refund sistemi ile)

**SMS Durumları:**
- `sent`: Gönderildi
- `delivered`: İletildi
- `failed`: Başarısız

---

## 💰 Kripto Ödeme Sistemi

### Desteklenen Kripto Paralar

1. **BTC (Bitcoin)**
   - Decimals: 8
   - Min Amount: 0.0001 BTC
   - Network Fee: 0.0001 BTC
   - Confirmations: 3

2. **ETH (Ethereum)**
   - Decimals: 18
   - Min Amount: 0.001 ETH
   - Network Fee: 0.005 ETH
   - Confirmations: 12

3. **USDT (Tether)**
   - Decimals: 6
   - Min Amount: 1 USDT
   - Network Fee: 1 USDT
   - Confirmations: 3
   - **Network**: TRC-20 (Tron)

4. **USDC (USD Coin)**
   - Decimals: 6
   - Min Amount: 1 USDC
   - Network Fee: 1 USDC
   - Confirmations: 3
   - **Network**: TRC-20 (Tron)

5. **TRX (TRON)**
   - Decimals: 6
   - Min Amount: 10 TRX
   - Network Fee: 1 TRX
   - Confirmations: 20

### Soğuk Cüzdan Adresi

**Tüm Kripto Paralar İçin:**
```
TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
```

**Not:** Tüm kripto paralar (BTC, ETH, USDT, USDC, TRX) için aynı TRX adresi kullanılıyor. Bu, Tron network üzerinden işlem yapıldığı için mümkündür.

### Fiyat API

**CoinMarketCap API:**
- **API Key**: `17aa5b111c584455912e0242e7dee2ce`
- **Base URL**: `https://pro-api.coinmarketcap.com/v1`
- **Fallback**: CoinGecko API

**Fiyat Alma:**
```javascript
const priceResult = await getCryptoPrice('BTC', 'TRY');
// Result: { success: true, price: 2850000, currency: "BTC", fiatCurrency: "TRY", source: "CoinMarketCap" }
```

### Ödeme Süreci

1. **Kullanıcı paket seçer** (örn: 1000 SMS = 1500 TRY)
2. **Kripto para seçer** (örn: BTC)
3. **Sistem fiyatı hesaplar** (örn: 1500 TRY / 2850000 = 0.0005263 BTC)
4. **QR kod oluşturulur** (cüzdan adresi)
5. **Kullanıcı ödemeyi yapar**
6. **Sistem ödeme durumunu kontrol eder** (şu anda demo modda)
7. **Kredi yüklenir**

**Ödeme Timeout:**
- 30 dakika içinde ödeme yapılmazsa iptal olur

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-domain.com

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRE=7d

# SMS Provider: CepSMS
SMS_PROVIDER=cepsms
CEPSMS_USERNAME=Testfn
CEPSMS_PASSWORD=Qaswed
CEPSMS_FROM=CepSMS

# Supabase (Hardcoded in utils/supabase.js)
# Supabase URL: https://ercvagagcdkpsuuygluu.supabase.co
# Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Supabase Service Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CoinMarketCap API
COINMARKETCAP_API_KEY=17aa5b111c584455912e0242e7dee2ce

# Cold Wallet (Tüm kripto paralar için)
COLD_WALLET_DEFAULT=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_BTC=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_ETH=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_USDT=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5
COLD_WALLET_TRX=TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5

# Security
BCRYPT_ROUNDS=12

# MongoDB (Optional - Supabase kullanılıyor)
# MONGODB_URI=mongodb://localhost:27017/sms_verification
```

### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:3001/api
```

### Supabase Credentials (Hardcoded)

**Dosya**: `utils/supabase.js`

```javascript
const supabaseUrl = 'https://ercvagagcdkpsuuygluu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY3ZhZ2FnY2RrcHN1dXlnbHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDE4MTUsImV4cCI6MjA3NzMxNzgxNX0.Nmpnn3MsNc-12UK-xE5yYzmMxkP-0w9xCEOKaQRl6AY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY3ZhZ2FnY2RrcHN1dXlnbHV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc0MTgxNSwiZXhwIjoyMDc3MzE3ODE1fQ.DVUPu6syOrOlJ6lBFHzmkb_nQro0ICUAVFc-UH3vnMc';
```

**⚠️ ÖNEMLİ:** Bu bilgiler kodda hardcoded. Production'da environment variables'a taşınmalı!

---

## 🚀 Deployment

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci --production=false
RUN cd client && npm ci --production=false
COPY . .
RUN cd client && npm run build
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

**Build:**
```bash
docker build -t sms-verification .
docker run -p 3001:3001 --env-file .env sms-verification
```

### Dokploy Deployment

**Build Command:**
```bash
npm ci
npm run install-client
cd client && npm install && npm run build
```

**Start Command:**
```bash
node server.js
```

**Port Mapping:**
- Container: `3001`
- Host: `3001`

**Health Check:**
- Path: `/api/health`
- Interval: 30 seconds
- Timeout: 5 seconds

**Environment Variables:**
- Tüm `.env` dosyasındaki değişkenler Dokploy'da tanımlanmalı

### Heroku Buildpack

**Buildpack**: `heroku/nodejs`

**Script:**
```json
"heroku-postbuild": "cd client && npm install && npm run build"
```

**Port:**
- Heroku otomatik olarak `PORT` environment variable'ını set eder

---

## 📖 Kullanım Senaryoları

### Senaryo 1: Yeni Kullanıcı Kaydı ve SMS Gönderimi

1. **Kullanıcı kaydı:**
   ```
   POST /api/supabase-auth/register
   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "Test123!@#"
   }
   ```

2. **Giriş yap:**
   ```
   POST /api/supabase-auth/login
   {
     "login": "testuser",
     "password": "Test123!@#"
   }
   ```

3. **Kişi ekle:**
   ```
   POST /api/contacts
   {
     "name": "Ahmet Yılmaz",
     "phone": "905075708797"
   }
   ```

4. **SMS gönder:**
   ```
   POST /api/bulk-sms/send-bulk
   {
     "contacts": ["contact-id"],
     "message": "Merhaba, bu bir test mesajıdır."
   }
   ```

### Senaryo 2: Kripto Ödeme ile Kredi Yükleme

1. **Paket seç:**
   ```
   GET /api/payment/packages
   ```

2. **Kripto ödeme oluştur:**
   ```
   POST /api/payment/crypto-create
   {
     "packageId": "starter",
     "cryptoCurrency": "USDT",
     "fiatAmount": 1500,
     "fiatCurrency": "TRY"
   }
   ```

3. **QR kodu göster ve kullanıcı ödeme yapar**

4. **Ödeme durumunu kontrol et:**
   ```
   GET /api/payment/crypto-status/:paymentId
   ```

### Senaryo 3: Toplu SMS Gönderimi

1. **Grup oluştur:**
   ```
   POST /api/contact-groups
   {
     "name": "Müşteriler",
     "color": "#1976d2"
   }
   ```

2. **Kişileri gruba ekle**

3. **Şablon oluştur:**
   ```
   POST /api/sms-templates
   {
     "name": "Hoş Geldiniz",
     "content": "Merhaba {{name}}, hoş geldiniz!",
     "category": "Genel"
   }
   ```

4. **Toplu SMS gönder:**
   ```
   POST /api/bulk-sms/send-bulk
   {
     "contacts": ["contact-id-1", "contact-id-2"],
     "message": "Merhaba, bu bir toplu mesajdır."
   }
   ```

---

## 🔑 Önemli Bilgiler

### Supabase Credentials

**URL**: `https://ercvagagcdkpsuuygluu.supabase.co`

**Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY3ZhZ2FnY2RrcHN1dXlnbHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDE4MTUsImV4cCI6MjA3NzMxNzgxNX0.Nmpnn3MsNc-12UK-xE5yYzmMxkP-0w9xCEOKaQRl6AY`

**Service Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY3ZhZ2FnY2RrcHN1dXlnbHV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc0MTgxNSwiZXhwIjoyMDc3MzE3ODE1fQ.DVUPu6syOrOlJ6lBFHzmkb_nQro0ICUAVFc-UH3vnMc`

### CepSMS Credentials

**Username**: `Testfn`
**Password**: `Qaswed`
**From**: `CepSMS`
**API URL**: `https://panel4.cepsms.com/smsapi`

### CoinMarketCap API Key

**API Key**: `17aa5b111c584455912e0242e7dee2ce`

### Cold Wallet Address

**Address**: `TDRrweahDMPgpCYZLMyEwxqNUkM12ptuw5`

**Not:** Tüm kripto paralar (BTC, ETH, USDT, USDC, TRX) için aynı TRX adresi kullanılıyor.

---

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. Kredi Kusurat Sorunu
**Sorun**: Floating point precision sorunları
**Çözüm**: `Math.round()` ile kredi değerleri tam sayıya yuvarlanır

### 2. Telefon Numarası Formatı
**Sorun**: Farklı formatlarda telefon numarası
**Çözüm**: Otomatik formatlama: `+90`, `90`, `0` prefix'leri kaldırılıp `90` eklenir

### 3. MongoDB Timeout
**Sorun**: MongoDB bağlantısı timeout oluyordu
**Çözüm**: MongoDB optional yapıldı, Supabase primary database

### 4. Rate Limiting
**Sorun**: Rate limiting aktifken sorunlar oluyordu
**Çözüm**: Şu anda devre dışı (commented out)

---

## 📝 Geliştirme Notları

### Yeni Özellik Ekleme

1. **Backend Route Ekleme:**
   ```javascript
   // routes/yeniRoute.js
   const router = express.Router();
   router.get('/endpoint', authenticateToken, async (req, res) => {
     // ...
   });
   module.exports = router;
   
   // server.js
   app.use('/api/yeni', authenticateToken, require('./routes/yeniRoute'));
   ```

2. **Frontend Page Ekleme:**
   ```typescript
   // src/pages/YeniSayfa.tsx
   const YeniSayfa: React.FC = () => {
     // ...
   };
   
   // App.tsx
   <Route path="/yeni" element={<ProtectedRoute><YeniSayfa /></ProtectedRoute>} />
   ```

### Database Migration

**Supabase SQL Editor'da çalıştır:**
```sql
-- Yeni kolon ekleme
ALTER TABLE users ADD COLUMN yeni_kolon VARCHAR(255);

-- Yeni tablo oluşturma
CREATE TABLE yeni_tablo (...);
```

### Test Etme

**Local Development:**
```bash
# Backend
npm start  # Port 3001

# Frontend
cd client && npm start  # Port 3000
```

**API Test:**
```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/supabase-auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"demo","password":"Demo123!"}'
```

---

## 📞 Destek ve İletişim

**Proje Adı**: Advanced SMS Verification System
**Version**: 1.0.0
**License**: MIT

**Dokümantasyon Tarihi**: 2025-01-05

---

## ✅ Son Kontrol Listesi

- [x] Backend API endpoints çalışıyor
- [x] Frontend sayfaları çalışıyor
- [x] Supabase bağlantısı aktif
- [x] CepSMS entegrasyonu çalışıyor
- [x] Kripto ödeme sistemi hazır
- [x] JWT authentication çalışıyor
- [x] 2FA desteği var
- [x] Docker deployment hazır
- [x] Dokploy deployment hazır
- [x] Health check endpoint'leri var

---

**Bu dokümantasyon, projenin tüm detaylarını içermektedir. Geliştiriciler bu dokümantasyonu referans alarak projeyi geliştirebilir ve yeni özellikler ekleyebilir.**

