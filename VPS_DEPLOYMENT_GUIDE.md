# VPS Deployment Rehberi - Next.js Projesi

## 📋 Genel Bakış

Bu rehber, Next.js projesini VPS üzerinde deploy etmek için adım adım talimatlar içerir:
- **panel.finsms.io** - Admin paneli için
- **platform.finsms.io** - Kullanıcı platformu için

## 🚀 VPS Gereksinimleri

### Minimum Sistem Gereksinimleri:
- **CPU:** 2 core
- **RAM:** 4GB
- **Disk:** 20GB SSD
- **OS:** Ubuntu 20.04/22.04 LTS (önerilen)

### Gerekli Yazılımlar:
- Node.js 18+ 
- npm 9+
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- Certbot (SSL Sertifikası)

## 📦 Adım 1: VPS Sunucu Hazırlığı

### 1.1 VPS'e Bağlanma

```bash
ssh root@your-vps-ip
# veya
ssh username@your-vps-ip
```

### 1.2 Sistem Güncellemesi

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Node.js Kurulumu

```bash
# Node.js 18.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Versiyon kontrolü
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 1.4 PM2 Kurulumu

```bash
sudo npm install -g pm2
```

### 1.5 Nginx Kurulumu

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.6 Git Kurulumu

```bash
sudo apt install git -y
```

## 📁 Adım 2: Proje Kurulumu

### 2.1 Proje Klasörü Oluşturma

```bash
# Proje klasörü oluştur
sudo mkdir -p /var/www/finsms
sudo chown -R $USER:$USER /var/www/finsms
cd /var/www/finsms
```

### 2.2 Git Repository'den Clone

```bash
# GitHub repository'den clone
git clone https://github.com/kilicc/finsms2.git .

# veya manuel olarak dosyaları yükle
```

### 2.3 Environment Variables Ayarlama

```bash
# .env dosyası oluştur
nano .env
```

**.env dosyası içeriği:**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# SMS Provider
SMS_PROVIDER=cepsms
CEPSMS_USERNAME=your-username
CEPSMS_PASSWORD=your-password
CEPSMS_FROM=CepSMS

# Next.js
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://panel.finsms.io/api
```

### 2.4 Bağımlılıkları Yükleme

```bash
npm install
```

### 2.5 Prisma Client Oluşturma

```bash
npx prisma generate
```

### 2.6 Production Build

```bash
npm run build
```

## 🔧 Adım 3: PM2 ile Process Manager Kurulumu

### 3.1 PM2 Ecosystem Dosyası Oluşturma

```bash
nano ecosystem.config.js
```

**ecosystem.config.js içeriği:**
```javascript
module.exports = {
  apps: [{
    name: 'finsms',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/finsms',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/finsms/error.log',
    out_file: '/var/log/finsms/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

### 3.2 Log Klasörü Oluşturma

```bash
sudo mkdir -p /var/log/finsms
sudo chown -R $USER:$USER /var/log/finsms
```

### 3.3 PM2 ile Uygulamayı Başlatma

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Adım 4: Nginx Reverse Proxy Yapılandırması

### 4.1 Nginx Config Dosyası Oluşturma

```bash
sudo nano /etc/nginx/sites-available/finsms
```

**Nginx Config (panel.finsms.io için):**
```nginx
# Admin Panel - panel.finsms.io
server {
    listen 80;
    server_name panel.finsms.io;

    # Let's Encrypt için geçici
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Platform için (platform.finsms.io) ekleyin:**
```nginx
# User Platform - platform.finsms.io
server {
    listen 80;
    server_name platform.finsms.io;

    # Let's Encrypt için geçici
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Nginx Config'i Aktif Etme

```bash
sudo ln -s /etc/nginx/sites-available/finsms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Adım 5: SSL Sertifikası (Let's Encrypt)

### 5.1 Certbot Kurulumu

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 SSL Sertifikası Oluşturma

```bash
# Her iki subdomain için SSL
sudo certbot --nginx -d panel.finsms.io -d platform.finsms.io
```

### 5.3 Otomatik Yenileme

```bash
# Certbot otomatik yenileme yapıyor, test edin:
sudo certbot renew --dry-run
```

## 📝 Adım 6: DNS Ayarları

### 6.1 DNS Kayıtları (Hostinger veya DNS Provider'ınızda)

**DNS Provider'ınızda (Hostinger) şu kayıtları ekleyin:**

```
Type: A
Name: panel
Value: YOUR_VPS_IP_ADDRESS
TTL: 3600

Type: A
Name: platform
Value: YOUR_VPS_IP_ADDRESS
TTL: 3600
```

**Not:** `YOUR_VPS_IP_ADDRESS` yerine VPS'inizin IP adresini yazın.

### 6.2 DNS Propagation Kontrolü

```bash
# DNS propagation kontrolü
dig panel.finsms.io
dig platform.finsms.io
```

## 🔄 Adım 7: Güncelleme ve Bakım

### 7.1 Proje Güncelleme

```bash
cd /var/www/finsms
git pull origin main
npm install
npx prisma generate
npm run build
pm2 restart finsms
```

### 7.2 Log Kontrolü

```bash
# PM2 logları
pm2 logs finsms

# Nginx logları
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 7.3 Servis Durumu Kontrolü

```bash
# PM2 durumu
pm2 status

# Nginx durumu
sudo systemctl status nginx

# Uygulama durumu
curl http://localhost:3000/api/health
```

## 🛡️ Adım 8: Güvenlik Ayarları

### 8.1 Firewall Yapılandırması

```bash
# UFW firewall kurulumu
sudo apt install ufw -y

# Gerekli portları aç
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Firewall'u aktif et
sudo ufw enable
sudo ufw status
```

### 8.2 Fail2ban Kurulumu (Opsiyonel)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📊 Adım 9: Monitoring ve Performance

### 9.1 PM2 Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# PM2 web interface (opsiyonel)
pm2 install pm2-server-monit
```

### 9.2 System Monitoring

```bash
# CPU ve RAM kullanımı
htop

# Disk kullanımı
df -h

# Network trafiği
iftop
```

## 🐛 Sorun Giderme

### Proje çalışmıyor
```bash
# PM2 logları kontrol et
pm2 logs finsms --lines 50

# Servisi yeniden başlat
pm2 restart finsms
```

### Nginx 502 Bad Gateway
```bash
# Next.js uygulamasının çalıştığını kontrol et
pm2 status
curl http://localhost:3000

# Nginx config'i kontrol et
sudo nginx -t
```

### SSL Sertifikası Hatası
```bash
# Sertifikayı yenile
sudo certbot renew

# Manuel yenileme
sudo certbot --nginx -d panel.finsms.io -d platform.finsms.io --force-renewal
```

### Database Bağlantı Hatası
```bash
# .env dosyasını kontrol et
cat .env | grep DATABASE_URL

# Prisma client'ı yeniden oluştur
npx prisma generate
```

## 📚 Ek Kaynaklar

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🔗 Hızlı Komut Referansı

```bash
# Proje güncelleme
cd /var/www/finsms && git pull && npm install && npm run build && pm2 restart finsms

# Log görüntüleme
pm2 logs finsms --lines 100

# Servis durumu
pm2 status && sudo systemctl status nginx

# Nginx reload
sudo nginx -t && sudo systemctl reload nginx

# SSL yenileme
sudo certbot renew
```

