#!/bin/bash

# Hızlı Cron Job Kurulum Script'i
# Kullanım: ./scripts/install-cron.sh

set -e

echo "🔄 Cron Job Kurulumu..."

# Proje dizini
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Domain kontrolü
DOMAIN="${DOMAIN:-https://makrosms.com}"

# .env dosyasından CRON_SECRET_KEY oku veya oluştur
if [ -f ".env" ]; then
    if grep -q "CRON_SECRET_KEY" .env; then
        CRON_SECRET_KEY=$(grep "CRON_SECRET_KEY" .env | cut -d '=' -f2 | tr -d ' ' | tr -d '"')
    else
        CRON_SECRET_KEY=$(openssl rand -hex 32)
        echo "" >> .env
        echo "CRON_SECRET_KEY=$CRON_SECRET_KEY" >> .env
        echo "✅ CRON_SECRET_KEY .env dosyasına eklendi"
    fi
else
    CRON_SECRET_KEY=$(openssl rand -hex 32)
    echo "CRON_SECRET_KEY=$CRON_SECRET_KEY" > .env
    echo "✅ .env dosyası oluşturuldu ve CRON_SECRET_KEY eklendi"
fi

echo ""
echo "📋 Cron Job Komutları:"
echo ""
echo "1. SMS Durum Kontrolü (Her 5 dakikada bir):"
echo "   */5 * * * * curl -X POST $DOMAIN/api/sms/check-status -H \"x-secret-key: $CRON_SECRET_KEY\" -s -o /dev/null"
echo ""
echo "2. Otomatik İade İşleme (Her saat başı):"
echo "   0 * * * * curl -X POST $DOMAIN/api/refunds/process-auto -H \"x-secret-key: $CRON_SECRET_KEY\" -s -o /dev/null"
echo ""
echo "🔑 CRON_SECRET_KEY: $CRON_SECRET_KEY"
echo ""
echo "⚠️  Bu komutları sunucuda crontab -e ile ekleyebilirsiniz"
echo "   veya Dokploy Dashboard'da Cron Jobs bölümünden ekleyebilirsiniz"
echo ""

