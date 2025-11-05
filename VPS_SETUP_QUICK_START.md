# VPS Hızlı Kurulum Rehberi

## ⚡ Hızlı Başlangıç (5 Dakika)

### 1. VPS'e Bağlan

```bash
ssh root@YOUR_VPS_IP
```

### 2. Tek Komutla Kurulum

```bash
# Tüm gerekli yazılımları kur
curl -fsSL https://raw.githubusercontent.com/kilicc/finsms2/main/vps-setup.sh | bash
```

**Manuel kurulum için:**

```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install nginx -y

# Git
sudo apt install git -y
```

### 3. Proje Kurulumu

```bash
# Proje klasörü
sudo mkdir -p /var/www/finsms
sudo chown -R $USER:$USER /var/www/finsms
cd /var/www/finsms

# Repository'den clone
git clone https://github.com/kilicc/finsms2.git .

# .env dosyası oluştur
nano .env
# (Environment variables'ları ekle)

# Bağımlılıkları yükle
npm install
npx prisma generate
npm run build
```

### 4. PM2 ile Başlat

```bash
# PM2 ecosystem dosyasını kopyala
cp ecosystem.config.js /var/www/finsms/

# Log klasörü
sudo mkdir -p /var/log/finsms
sudo chown -R $USER:$USER /var/log/finsms

# PM2 başlat
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx Yapılandırması

```bash
# Nginx config dosyasını oluştur
sudo nano /etc/nginx/sites-available/finsms
# (nginx.conf.example içeriğini kopyala)

# Aktif et
sudo ln -s /etc/nginx/sites-available/finsms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. DNS Ayarları

**Hostinger DNS Panel'de:**

```
Type: A
Name: panel
Value: YOUR_VPS_IP
TTL: 3600

Type: A
Name: platform
Value: YOUR_VPS_IP
TTL: 3600
```

### 7. SSL Sertifikası

```bash
# Certbot kur
sudo apt install certbot python3-certbot-nginx -y

# SSL oluştur
sudo certbot --nginx -d panel.finsms.io -d platform.finsms.io
```

### 8. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔄 Güncelleme

```bash
cd /var/www/finsms
./deploy.sh
```

## 📊 Durum Kontrolü

```bash
pm2 status
sudo systemctl status nginx
curl http://localhost:3000/api/health
```

## 🐛 Sorun Giderme

```bash
# Loglar
pm2 logs finsms
sudo tail -f /var/log/nginx/error.log

# Nginx test
sudo nginx -t

# PM2 restart
pm2 restart finsms
```

