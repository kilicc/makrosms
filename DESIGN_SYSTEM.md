# 🎨 Tasarım Sistemi - Birebir Görünüm Dokümantasyonu

## 📋 İçindekiler
1. [Renk Paleti](#renk-paleti)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Component Stilleri](#component-stilleri)
5. [Sayfa Tasarımları](#sayfa-tasarımları)
6. [Animasyonlar](#animasyonlar)
7. [Gradient'ler](#gradientler)
8. [Logo ve Görseller](#logo-ve-görseller)

---

## 🎨 Renk Paleti

### Ana Renkler

```javascript
// Material-UI Theme Palette
palette: {
  mode: 'light',
  
  // Primary Color (Mavi)
  primary: {
    main: '#1976d2',  // Ana mavi
  },
  
  // Secondary Color (Pembe/Kırmızı)
  secondary: {
    main: '#dc004e',  // Ana pembe
  },
  
  // Background
  background: {
    default: '#f5f5f5',  // Açık gri arka plan
    paper: '#ffffff',    // Kart arka planı
  },
}
```

### Özel Renkler

```javascript
// Login Sayfası Gradient
backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
// Mor-mavi gradient (Login ve Register sayfalarında)

// Navbar Gradient
navbarGradient: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)'
// Mavi-pembe gradient (Navbar'da)

// Card Background Gradients
cardGradientLight: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.05) 100%)'
cardGradientMedium: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)'
```

### Durum Renkleri

```javascript
// Success (Başarılı)
success: '#4caf50'  // Yeşil
successAlpha: 'rgba(76, 175, 80, 0.2)'  // Şeffaf yeşil

// Error (Hata)
error: '#f44336'  // Kırmızı
errorAlpha: 'rgba(244, 67, 54, 0.1)'

// Warning (Uyarı)
warning: '#ff9800'  // Turuncu
warningAlpha: 'rgba(255, 193, 7, 0.2)'

// Info (Bilgi)
info: '#2196f3'  // Açık mavi
infoAlpha: 'rgba(33, 150, 243, 0.2)'
```

### Text Renkleri

```javascript
text: {
  primary: 'rgba(0, 0, 0, 0.87)',    // Ana metin
  secondary: 'rgba(0, 0, 0, 0.6)',   // İkincil metin
  disabled: 'rgba(0, 0, 0, 0.38)',   // Devre dışı metin
}
```

---

## 📝 Typography

### Font Family

```javascript
fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
```

### Font Boyutları ve Ağırlıkları

```javascript
// H4 Başlık
h4: {
  fontWeight: 600,  // Semi-bold
  fontSize: '2.125rem',  // 34px
}

// H5 Alt Başlık
h5: {
  fontWeight: 500,  // Medium
  fontSize: '1.5rem',  // 24px
}

// H6 Başlık
h6: {
  fontWeight: 500,
  fontSize: '1.25rem',  // 20px
}

// Body 1 (Ana metin)
body1: {
  fontSize: '1rem',  // 16px
  fontWeight: 400,
}

// Body 2 (İkincil metin)
body2: {
  fontSize: '0.875rem',  // 14px
  fontWeight: 400,
}

// Caption (Açıklama metni)
caption: {
  fontSize: '0.75rem',  // 12px
  fontWeight: 400,
}
```

---

## 📐 Spacing & Layout

### Breakpoints

```javascript
// Material-UI Breakpoints
xs: 0px      // Extra small
sm: 600px    // Small
md: 900px    // Medium
lg: 1200px   // Large
xl: 1536px   // Extra large
```

### Spacing Sistemi

```javascript
// Material-UI spacing (8px base unit)
spacing: {
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
}
```

### Layout Yapıları

```javascript
// Ana Container
mainContainer: {
  display: 'flex',
  minHeight: '100vh',
  flexGrow: 1,
  padding: 3,  // 24px
  marginLeft: { xs: 0, md: '280px' },  // Sidebar genişliği
  backgroundColor: '#f5f5f5',
}

// Navbar (Sidebar)
navbar: {
  width: 280,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
}

// Kartlar
card: {
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  padding: 3,  // 24px
}
```

---

## 🧩 Component Stilleri

### Button

```javascript
MuiButton: {
  styleOverrides: {
    root: {
      textTransform: 'none',     // Küçük harf korunur
      borderRadius: 8,           // 8px yuvarlatılmış köşeler
      padding: '10px 24px',
      fontWeight: 500,
    },
  },
}
```

**Button Örnekleri:**
```javascript
// Primary Button
<Button variant="contained" color="primary">
  Gönder
</Button>

// Secondary Button
<Button variant="outlined" color="secondary">
  İptal
</Button>

// Text Button
<Button variant="text" color="primary">
  Daha Fazla
</Button>
```

### Card

```javascript
MuiCard: {
  styleOverrides: {
    root: {
      borderRadius: 12,                    // 12px yuvarlatılmış köşeler
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',  // Yumuşak gölge
      padding: 3,                          // 24px iç boşluk
    },
  },
}
```

**Card Örnekleri:**
```javascript
// Basit Card
<Card>
  <CardContent>
    <Typography variant="h6">Başlık</Typography>
    <Typography variant="body2" color="text.secondary">
      İçerik
    </Typography>
  </CardContent>
</Card>

// Gradient Card
<Card sx={{
  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.05) 100%)',
  border: '1px solid rgba(25, 118, 210, 0.1)',
}}>
  ...
</Card>
```

### TextField

```javascript
// Standard TextField
<TextField
  fullWidth
  label="Label"
  variant="outlined"
  sx={{
    mb: 3,
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,  // 16px
    },
  }}
/>
```

### Chip

```javascript
// Durum Chip'leri
<Chip 
  label="Başarılı" 
  color="success" 
  size="small" 
/>

<Chip 
  label="Beklemede" 
  color="warning" 
  size="small" 
/>

<Chip 
  label="Hata" 
  color="error" 
  size="small" 
/>
```

---

## 📄 Sayfa Tasarımları

### Login Sayfası

**Arka Plan:**
```javascript
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
minHeight: '100vh'
display: 'flex'
alignItems: 'center'
justifyContent: 'center'
```

**Layout:**
- **Sol Taraf (50%)**: Özellikler kartları
- **Sağ Taraf (50%)**: Giriş formu

**Logo:**
```javascript
<img 
  src="/logo3.png" 
  alt="Logo"
  style={{
    width: 200,
    height: 200,
    objectFit: 'contain',
  }}
/>
```

**Login Card:**
```javascript
<Card sx={{
  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
  padding: 3,
  textAlign: 'center',
}}>
  {/* Header with gradient background */}
</Card>

<CardContent sx={{ padding: 4 }}>
  {/* Login form */}
</CardContent>
```

**Özellik Kartları:**
```javascript
<Card sx={{
  backgroundColor: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: 2,
  textAlign: 'center',
}}>
  <Icon sx={{ fontSize: 48, color: 'white', mb: 1 }} />
  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
    Başlık
  </Typography>
  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
    Açıklama
  </Typography>
</Card>
```

### Dashboard

**Ana Layout:**
```javascript
<Container maxWidth="xl">
  <Grid container spacing={3}>
    {/* Stat Cards */}
    <Grid item xs={12} sm={6} md={3}>
      <StatCard />
    </Grid>
    
    {/* Charts */}
    <Grid item xs={12} md={8}>
      <ChartCard />
    </Grid>
    
    {/* Recent Activity */}
    <Grid item xs={12} md={4}>
      <ActivityCard />
    </Grid>
  </Grid>
</Container>
```

**Stat Card:**
```javascript
<Card sx={{
  height: '100%',
  background: cardGradientLight,
  border: `1px solid ${alpha(primary.main, 0.1)}`,
}}>
  <CardContent>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" color="primary" fontWeight="bold">
          {value}
        </Typography>
      </Box>
      <Avatar sx={{ 
        bgcolor: color, 
        width: 56, 
        height: 56 
      }}>
        {icon}
      </Avatar>
    </Box>
  </CardContent>
</Card>
```

### Navbar (Sidebar)

**Genişlik:** 280px

**Yapı:**
```javascript
<Drawer
  variant="permanent"
  sx={{
    width: 280,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: 280,
      boxSizing: 'border-box',
      borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    },
  }}
>
  {/* Logo */}
  <Box sx={{ 
    p: 2, 
    bgcolor: alpha(primary.main, 0.05),
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  }}>
    <img 
      src="/logo3.png" 
      alt="Logo"
      style={{
        width: 150,
        height: 50,
        objectFit: 'contain',
      }}
    />
  </Box>
  
  {/* User Info */}
  <Box sx={{ p: 2, bgcolor: alpha(primary.main, 0.05) }}>
    <Avatar sx={{ bgcolor: primary.main, mb: 1 }}>
      {userInitials}
    </Avatar>
    <Typography variant="subtitle2" fontWeight="bold">
      {user.username}
    </Typography>
    <Chip 
      label={`${user.credit} SMS`} 
      color="primary" 
      size="small" 
    />
  </Box>
  
  {/* Menu Items */}
  <List>
    {menuItems.map((item) => (
      <ListItemButton
        selected={isActive(item.path)}
        sx={{
          bgcolor: isActive(item.path) 
            ? alpha(primary.main, 0.1) 
            : 'transparent',
          '&:hover': {
            bgcolor: alpha(primary.main, 0.05),
          },
        }}
      >
        <ListItemIcon sx={{ 
          color: isActive(item.path) 
            ? primary.main 
            : 'inherit' 
        }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          secondary={item.description}
          primaryTypographyProps={{
            fontWeight: isActive(item.path) ? 600 : 400,
            color: isActive(item.path) ? primary.main : 'inherit',
          }}
        />
      </ListItemButton>
    ))}
  </List>
  
  {/* Logout */}
  <ListItemButton
    sx={{
      bgcolor: alpha(error.main, 0.05),
    }}
  >
    <ListItemIcon sx={{ color: error.main }}>
      <Logout />
    </ListItemIcon>
    <ListItemText
      primary="Çıkış Yap"
      primaryTypographyProps={{
        color: error.main,
      }}
    />
  </ListItemButton>
</Drawer>
```

### AdvancedSMS Sayfası

**Layout:**
```javascript
<Container maxWidth="xl">
  <Grid container spacing={3}>
    {/* Sol Panel - Grup/Kişi Seçimi */}
    <Grid item xs={12} md={4}>
      <Card>
        {/* Grup seçimi */}
        {/* Kişi listesi */}
      </Card>
    </Grid>
    
    {/* Sağ Panel - Mesaj Yazma */}
    <Grid item xs={12} md={8}>
      <Card>
        {/* Mesaj yazma alanı */}
        {/* Şablon seçimi */}
        {/* Gönder butonu */}
      </Card>
    </Grid>
  </Grid>
</Container>
```

### Contacts Sayfası

**Tabs:**
```javascript
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="Kişiler" icon={<Person />} />
  <Tab label="Gruplar" icon={<Group />} />
</Tabs>
```

**Kişi Kartı:**
```javascript
<Card sx={{ mb: 2 }}>
  <CardContent>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant="h6">{contact.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {contact.phone}
        </Typography>
      </Box>
      <Box>
        <IconButton color="primary" onClick={handleEdit}>
          <Edit />
        </IconButton>
        <IconButton color="error" onClick={handleDelete}>
          <Delete />
        </IconButton>
      </Box>
    </Box>
  </CardContent>
</Card>
```

---

## ✨ Animasyonlar

### Fade In

```javascript
<Fade in timeout={1000}>
  <Card>
    {/* Content */}
  </Card>
</Fade>
```

### Slide In

```javascript
<Slide direction="up" in timeout={800}>
  <Card>
    {/* Content */}
  </Card>
</Slide>
```

### Zoom In

```javascript
<Zoom in timeout={600}>
  <Button variant="contained">
    Gönder
  </Button>
</Zoom>
```

---

## 🌈 Gradient'ler

### Login Sayfası Gradient

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Renkler:**
- Başlangıç: `#667eea` (Mor-mavi)
- Bitiş: `#764ba2` (Mor)

### Navbar Gradient

```css
background: linear-gradient(135deg, #1976d2 0%, #dc004e 100%);
```

**Renkler:**
- Başlangıç: `#1976d2` (Mavi)
- Bitiş: `#dc004e` (Pembe)

### Card Gradient (Light)

```css
background: linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.05) 100%);
```

**Kullanım:** Kart arka planları, hafif vurgu

### Card Gradient (Medium)

```css
background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
```

**Kullanım:** Overlay kartlar, içerik kartları

### Button Gradient

```css
background: linear-gradient(135deg, #1976d2 0%, #dc004e 100%);
box-shadow: 0 6px 20px rgba(25, 118, 210, 0.3);
```

**Kullanım:** Primary action butonları

---

## 🖼️ Logo ve Görseller

### Logo

**Dosya:** `/logo3.png`

**Kullanım Yerleri:**
1. **Navbar (Sidebar):**
   - Genişlik: 150px
   - Yükseklik: 50px
   - `objectFit: 'contain'`

2. **Login Sayfası:**
   - Genişlik: 200px
   - Yükseklik: 200px
   - `objectFit: 'contain'`

3. **Favicon:**
   - Dosya: `logo3.png`
   - Browser tab'ında görünür

### Icon Kullanımı

**Material-UI Icons:**
- `@mui/icons-material` paketinden
- Boyut: `24px` (default)
- Renk: Theme'den (`primary`, `secondary`, `error`, vb.)

**Örnek Icon'lar:**
```javascript
import {
  Dashboard,
  Sms,
  Person,
  AccountBalanceWallet,
  Settings,
  Logout,
  // ...
} from '@mui/icons-material';
```

---

## 📱 Responsive Tasarım

### Mobile (xs - 600px)

```javascript
// Navbar gizlenir, drawer olur
<Drawer
  variant="temporary"
  open={mobileOpen}
  onClose={handleDrawerToggle}
>
  {/* Menu items */}
</Drawer>

// Main content full width
<Box sx={{ ml: { xs: 0, md: '280px' } }}>
  {/* Content */}
</Box>
```

### Tablet (md - 900px)

```javascript
// Grid columns
<Grid item xs={12} md={6}>
  {/* 2 sütun */}
</Grid>

<Grid item xs={12} md={4}>
  {/* 3 sütun */}
</Grid>
```

### Desktop (lg+ - 1200px+)

```javascript
// Full layout
<Grid item xs={12} md={8} lg={6}>
  {/* Responsive columns */}
</Grid>
```

---

## 🎯 Component Örnekleri

### Stat Card (İstatistik Kartı)

```javascript
<Card sx={{
  height: '100%',
  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.05) 100%)',
  border: '1px solid rgba(25, 118, 210, 0.1)',
  borderRadius: 2,
  p: 3,
}}>
  <Box display="flex" alignItems="center" justifyContent="space-between">
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" color="primary" fontWeight="bold">
        {value}
      </Typography>
      {change && (
        <Box display="flex" alignItems="center" mt={1}>
          <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
          <Typography variant="caption" color="success.main">
            +{change}%
          </Typography>
        </Box>
      )}
    </Box>
    <Avatar sx={{ 
      bgcolor: color, 
      width: 56, 
      height: 56 
    }}>
      {icon}
    </Avatar>
  </Box>
</Card>
```

### Action Button

```javascript
<Button
  variant="contained"
  color="primary"
  size="large"
  startIcon={<Send />}
  sx={{
    background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
    '&:hover': {
      boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
    },
  }}
>
  Gönder
</Button>
```

### Alert Card

```javascript
<Alert 
  severity="success"
  icon={<CheckCircle />}
  sx={{
    borderRadius: 2,
    mb: 2,
  }}
>
  {message}
</Alert>
```

### Loading State

```javascript
<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
  <CircularProgress color="primary" />
</Box>
```

---

## 🎨 CSS Sınıfları

### Özel Sınıflar

```css
/* MuiBox-root - Logo container */
.MuiBox-root {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Logo image */
img[src="/logo3.png"] {
  width: 150px;  /* Navbar */
  height: 50px;  /* Navbar */
  object-fit: contain;
}

/* Login page logo */
.login-logo {
  width: 200px;
  height: 200px;
  object-fit: contain;
}
```

---

## 📏 Ölçüler ve Boyutlar

### Navbar
- **Genişlik**: 280px
- **Yükseklik**: 100vh (tam ekran)
- **Logo Genişlik**: 150px
- **Logo Yükseklik**: 50px

### Login Sayfası
- **Logo Genişlik**: 200px
- **Logo Yükseklik**: 200px
- **Card Genişlik**: Maksimum 600px
- **Card Padding**: 24px (3 * 8px)

### Kartlar
- **Border Radius**: 12px
- **Padding**: 24px (3 * 8px)
- **Box Shadow**: `0 2px 8px rgba(0,0,0,0.1)`

### Butonlar
- **Border Radius**: 8px
- **Padding**: 10px 24px
- **Font Weight**: 500 (Medium)

### Avatar'lar
- **Küçük**: 32px (Stat cards)
- **Orta**: 40px (User info)
- **Büyük**: 56px (Ana stat cards)

---

## 🔄 State Stilleri

### Hover States

```javascript
// Button hover
'&:hover': {
  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
  transform: 'translateY(-2px)',
}

// Card hover
'&:hover': {
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  transform: 'translateY(-4px)',
}

// ListItem hover
'&:hover': {
  bgcolor: alpha(primary.main, 0.05),
}
```

### Active States

```javascript
// Active menu item
selected: true,
sx: {
  bgcolor: alpha(primary.main, 0.1),
  '& .MuiListItemIcon-root': {
    color: primary.main,
  },
}
```

### Disabled States

```javascript
disabled: true,
sx: {
  opacity: 0.5,
  cursor: 'not-allowed',
}
```

---

## 📦 Önemli Dosyalar

### Theme Dosyası
- **Dosya**: `client/src/App.tsx`
- **Satır**: 25-65

### Logo Dosyası
- **Dosya**: `client/public/logo3.png`
- **Kullanım**: Tüm sayfalarda

### CSS Dosyaları
- **Dosya**: `client/src/index.css`
- **Dosya**: `client/src/App.css`

---

## 🎯 Kullanım Örnekleri

### Yeni Sayfa Oluşturma

```typescript
import React from 'react';
import { Container, Card, CardContent, Typography, Box } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

const NewPage: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Card sx={{
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" color="primary" fontWeight={600}>
            Başlık
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            İçerik
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NewPage;
```

### Yeni Component Oluşturma

```typescript
import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: 2,
      p: 3,
    }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </Card>
  );
};

export default StatCard;
```

---

## ✅ Kontrol Listesi

Görünümü birebir kopyalamak için:

- [x] Renk paleti tanımlı
- [x] Typography ayarları tanımlı
- [x] Spacing sistemi tanımlı
- [x] Component stilleri tanımlı
- [x] Gradient'ler tanımlı
- [x] Logo boyutları tanımlı
- [x] Responsive breakpoints tanımlı
- [x] Animasyonlar tanımlı
- [x] Hover/Active states tanımlı

---

**Bu dokümantasyonu kullanarak görünümü birebir kopyalayabilirsiniz. Tüm renkler, boyutlar, spacing'ler ve stiller burada detaylı olarak açıklanmıştır.**

