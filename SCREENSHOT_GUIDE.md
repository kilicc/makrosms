# 📸 Ekran Görüntüsü Alma Rehberi

## 🎯 Amaç
Tüm sayfaların ekran görüntülerini alarak görünümü birebir kopyalayabilmek.

---

## 📋 Alınacak Ekran Görüntüleri

### 1. Login Sayfası
- **URL**: `http://localhost:3000/login`
- **Boyut**: 1920x1080 (Full HD)
- **Önemli**: Logo, form, gradient arka plan

### 2. Dashboard
- **URL**: `http://localhost:3000/dashboard`
- **Boyut**: 1920x1080
- **Önemli**: Stat cards, navbar, recent activities

### 3. SMS Gönder Sayfası
- **URL**: `http://localhost:3000/sms`
- **Boyut**: 1920x1080
- **Önemli**: Form alanları, butonlar

### 4. Gelişmiş SMS
- **URL**: `http://localhost:3000/advanced-sms`
- **Boyut**: 1920x1080
- **Önemli**: Grup seçimi, mesaj yazma alanı

### 5. Rehber Sayfası
- **URL**: `http://localhost:3000/contacts`
- **Boyut**: 1920x1080
- **Önemli**: Kişi listesi, grup yönetimi

### 6. Kripto Ödeme
- **URL**: `http://localhost:3000/payment`
- **Boyut**: 1920x1080
- **Önemli**: Paket seçimi, QR kod

### 7. Profil
- **URL**: `http://localhost:3000/profile`
- **Boyut**: 1920x1080
- **Önemli**: Kullanıcı bilgileri, ayarlar

---

## 🛠️ Ekran Görüntüsü Alma Yöntemleri

### Yöntem 1: Browser DevTools (Chrome/Edge)

1. **F12** tuşuna basın (DevTools açılır)
2. **Ctrl+Shift+P** (Windows) veya **Cmd+Shift+P** (Mac)
3. "Screenshot" yazın ve seçin:
   - `Capture full size screenshot` - Tüm sayfa
   - `Capture node screenshot` - Seçili element
   - `Capture area screenshot` - Seçili alan

### Yöntem 2: Browser Extension (Full Page Screen Capture)

**Chrome Extension**: "Full Page Screen Capture"
1. Extension'ı yükleyin
2. Icon'a tıklayın
3. Sayfa otomatik olarak kaydedilir

### Yöntem 3: Puppeteer Script (Otomatik)

```javascript
// screenshot-all-pages.js
const puppeteer = require('puppeteer');

const pages = [
  { name: 'login', url: 'http://localhost:3000/login' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'sms', url: 'http://localhost:3000/sms' },
  { name: 'advanced-sms', url: 'http://localhost:3000/advanced-sms' },
  { name: 'contacts', url: 'http://localhost:3000/contacts' },
  { name: 'payment', url: 'http://localhost:3000/payment' },
  { name: 'profile', url: 'http://localhost:3000/profile' },
];

async function takeScreenshots() {
  const browser = await puppeteer.launch();
  
  for (const page of pages) {
    const pageInstance = await browser.newPage();
    await pageInstance.setViewport({ width: 1920, height: 1080 });
    await pageInstance.goto(page.url, { waitUntil: 'networkidle0' });
    await pageInstance.screenshot({ 
      path: `screenshots/${page.name}.png`,
      fullPage: true 
    });
    await pageInstance.close();
  }
  
  await browser.close();
}

takeScreenshots();
```

### Yöntem 4: Selenium (Python)

```python
# screenshot_all.py
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

pages = [
    {'name': 'login', 'url': 'http://localhost:3000/login'},
    {'name': 'dashboard', 'url': 'http://localhost:3000/dashboard'},
    {'name': 'sms', 'url': 'http://localhost:3000/sms'},
]

options = Options()
options.add_argument('--window-size=1920,1080')
driver = webdriver.Chrome(options=options)

for page in pages:
    driver.get(page['url'])
    driver.save_screenshot(f"screenshots/{page['name']}.png")

driver.quit()
```

---

## 📐 Önerilen Ekran Boyutları

### Desktop
- **Full HD**: 1920x1080
- **2K**: 2560x1440
- **4K**: 3840x2160

### Tablet
- **iPad**: 768x1024
- **iPad Pro**: 1024x1366

### Mobile
- **iPhone**: 375x667
- **iPhone Plus**: 414x736
- **Android**: 360x640

---

## 🎨 CSS ve Stil Bilgileri

### Tüm Renkler (CSS Variables)

```css
:root {
  --primary-main: #1976d2;
  --secondary-main: #dc004e;
  --success-main: #4caf50;
  --error-main: #f44336;
  --warning-main: #ff9800;
  --info-main: #2196f3;
  --background-default: #f5f5f5;
  --text-primary: rgba(0, 0, 0, 0.87);
  --text-secondary: rgba(0, 0, 0, 0.6);
}
```

### Gradient'ler

```css
/* Login Background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Navbar Header */
background: linear-gradient(135deg, #1976d2 0%, #dc004e 100%);

/* Card Light */
background: linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.05) 100%);
```

### Font Family

```css
font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

### Border Radius

```css
--radius-button: 8px;
--radius-card: 12px;
--radius-chip: 16px;
--radius-avatar: 50%;
```

### Box Shadow

```css
--shadow-card: 0 2px 8px rgba(0,0,0,0.1);
--shadow-button: 0 6px 20px rgba(25, 118, 210, 0.3);
--shadow-logo: 0 8px 16px rgba(0, 0, 0, 0.3);
```

---

## 📦 Dosya Yapısı

```
screenshots/
├── login.png
├── dashboard.png
├── sms.png
├── advanced-sms.png
├── contacts.png
├── payment.png
├── profile.png
└── admin.png

design-files/
├── exported-styles.css
├── HTML_TEMPLATES.html
├── DESIGN_SYSTEM.md
└── logo3.png
```

---

## ✅ Checklist

Ekran görüntülerini alırken:

- [ ] Login sayfası (1920x1080)
- [ ] Dashboard (1920x1080)
- [ ] SMS gönder sayfası (1920x1080)
- [ ] Gelişmiş SMS (1920x1080)
- [ ] Rehber sayfası (1920x1080)
- [ ] Kripto ödeme (1920x1080)
- [ ] Profil sayfası (1920x1080)
- [ ] Admin panel (1920x1080)
- [ ] Responsive görünümler (mobile, tablet)
- [ ] Logo dosyası (logo3.png)
- [ ] CSS dosyası (exported-styles.css)
- [ ] HTML template'leri (HTML_TEMPLATES.html)

---

**Tüm ekran görüntülerini aldıktan sonra, exported-styles.css ve HTML_TEMPLATES.html dosyalarını kullanarak görünümü birebir kopyalayabilirsiniz!**

