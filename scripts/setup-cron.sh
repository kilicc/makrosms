#!/bin/bash

# SMS Durum Kontrolü ve Otomatik İade Cron Job Kurulum Script'i
# Bu script sunucuda cron job'u otomatik olarak kurar

set -e

echo "🔄 Cron Job Kurulumu Başlatılıyor..."

# Proje dizini
PROJECT_DIR="/var/www/finsms"
CRON_SECRET_KEY="${CRON_SECRET_KEY:-$(openssl rand -hex 32)}"
DOMAIN="${DOMAIN:-https://panel.finsms.io}"

# .env dosyasına CRON_SECRET_KEY ekle (yoksa)
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ .env dosyası bulunamadı!"
    exit 1
fi

# CRON_SECRET_KEY kontrolü
if ! grep -q "CRON_SECRET_KEY" "$PROJECT_DIR/.env"; then
    echo "CRON_SECRET_KEY=$CRON_SECRET_KEY" >> "$PROJECT_DIR/.env"
    echo "✅ CRON_SECRET_KEY .env dosyasına eklendi: $CRON_SECRET_KEY"
else
    echo "ℹ️  CRON_SECRET_KEY zaten .env dosyasında mevcut"
    CRON_SECRET_KEY=$(grep "CRON_SECRET_KEY" "$PROJECT_DIR/.env" | cut -d '=' -f2)
fi

# Cron job komutu
CRON_CMD="*/5 * * * * curl -X POST $DOMAIN/api/sms/check-status -H \"x-secret-key: $CRON_SECRET_KEY\" -H \"Content-Type: application/json\" -s -o /dev/null -w \"%{http_code}\" | grep -q \"200\" || echo \"SMS durum kontrolü hatası: \$(date)\" >> /var/log/finsms/cron.log 2>&1"

# Otomatik iade cron job komutu (her saat başı)
REFUND_CRON_CMD="0 * * * * curl -X POST $DOMAIN/api/refunds/process-auto -H \"x-secret-key: $CRON_SECRET_KEY\" -H \"Content-Type: application/json\" -s -o /dev/null -w \"%{http_code}\" | grep -q \"200\" || echo \"Otomatik iade işleme hatası: \$(date)\" >> /var/log/finsms/cron.log 2>&1"

# Log klasörü oluştur
sudo mkdir -p /var/log/finsms
sudo chown -R $USER:$USER /var/log/finsms

# Mevcut cron job'ları kontrol et
CRON_FILE="/tmp/finsms_cron_$(date +%s)"

# Mevcut cron job'ları al
crontab -l > "$CRON_FILE" 2>/dev/null || touch "$CRON_FILE"

# SMS durum kontrolü cron job'unu ekle (eğer yoksa)
if ! grep -q "api/sms/check-status" "$CRON_FILE"; then
    echo "$CRON_CMD" >> "$CRON_FILE"
    echo "✅ SMS durum kontrolü cron job'u eklendi (her 5 dakikada bir)"
else
    echo "ℹ️  SMS durum kontrolü cron job'u zaten mevcut"
fi

# Otomatik iade cron job'unu ekle (eğer yoksa)
if ! grep -q "api/refunds/process-auto" "$CRON_FILE"; then
    echo "$REFUND_CRON_CMD" >> "$CRON_FILE"
    echo "✅ Otomatik iade cron job'u eklendi (her saat başı)"
else
    echo "ℹ️  Otomatik iade cron job'u zaten mevcut"
fi

# Cron job'ları yükle
crontab "$CRON_FILE"
rm "$CRON_FILE"

echo ""
echo "✅ Cron Job Kurulumu Tamamlandı!"
echo ""
echo "📋 Kurulu Cron Job'lar:"
crontab -l | grep -E "(api/sms/check-status|api/refunds/process-auto)" || echo "  (Henüz cron job bulunamadı)"
echo ""
echo "📝 Log Dosyası: /var/log/finsms/cron.log"
echo "🔑 CRON_SECRET_KEY: $CRON_SECRET_KEY"
echo ""
echo "🔍 Cron Job'ları Kontrol Etmek İçin:"
echo "   crontab -l"
echo ""
echo "🗑️  Cron Job'ları Silmek İçin:"
echo "   crontab -e"
echo "   (İlgili satırları silin)"

