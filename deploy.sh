#!/bin/bash

# VPS Deployment Script
# Kullanım: ./deploy.sh

set -e

echo "🚀 FinsMS Deployment Başlatılıyor..."

# Proje dizini
PROJECT_DIR="/var/www/makrosms"
cd $PROJECT_DIR

echo "📦 Git'ten güncelleme çekiliyor..."
git pull origin main

echo "📥 Bağımlılıklar yükleniyor..."
npm install

echo "🔄 Prisma Client oluşturuluyor..."
npx prisma generate

echo "🏗️ Production build oluşturuluyor..."
npm run build

echo "🔄 PM2 restart ediliyor..."
pm2 restart makrosms

echo "✅ Deployment tamamlandı!"
echo "📊 PM2 durumu:"
pm2 status

echo "📝 Son loglar:"
pm2 logs makrosms --lines 20 --nostream

