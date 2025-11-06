import axios from 'axios';
import https from 'https';

interface CepSMSResponse {
  Status?: string;
  status?: string;
  statusCode?: number;
  MessageId?: string;
  messageId?: string;
  id?: string;
  Error?: string;
  error?: string;
  message?: string;
  [key: string]: any; // Farklı formatlar için
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const CEPSMS_USERNAME = process.env.CEPSMS_USERNAME || 'Testfn';
const CEPSMS_PASSWORD = process.env.CEPSMS_PASSWORD || 'Qaswed';
const CEPSMS_FROM = process.env.CEPSMS_FROM || 'CepSMS';
const CEPSMS_API_URL = 'https://panel4.cepsms.com/smsapi';

// HTTPS agent - SSL sertifika doğrulamasını atla (development için)
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
});

/**
 * Telefon numarasını CepSMS formatına dönüştür (905xxxxxxxxx)
 */
export function formatPhoneNumber(phone: string): string {
  // Sadece rakamları al
  let cleaned = phone.replace(/\D/g, '');
  
  // 12 haneli ve 90 ile başlıyorsa (905xxxxxxxxx) - bu geçerli bir format
  if (cleaned.length === 12 && cleaned.startsWith('90') && cleaned.startsWith('905')) {
    return cleaned;
  }
  
  // 11 haneli ve 90 ile başlıyorsa (90xxxxxxxxx) - bu da geçerli
  if (cleaned.length === 11 && cleaned.startsWith('90')) {
    return cleaned;
  }
  
  // 0 ile başlıyorsa (0xxxxxxxxx)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1); // 0'ı kaldır
    if (cleaned.length === 10 && cleaned.startsWith('5')) {
      return '90' + cleaned;
    }
  }
  
  // 10 haneli ve 5 ile başlıyorsa (5xxxxxxxxx)
  if (cleaned.length === 10 && cleaned.startsWith('5')) {
    return '90' + cleaned;
  }
  
  // 11 haneli ve 5 ile başlıyorsa (5xxxxxxxxxx) - 0 eksik, 90 ekle
  if (cleaned.length === 11 && cleaned.startsWith('5')) {
    return '90' + cleaned.substring(0, 10);
  }
  
  // 12 haneli ve 5 ile başlıyorsa (5xxxxxxxxxxx) - başındaki 5'i kaldır ve 90 ekle
  if (cleaned.length === 12 && cleaned.startsWith('5')) {
    return '90' + cleaned.substring(0, 10);
  }
  
  throw new Error(`Geçersiz telefon numarası formatı: ${phone}. Lütfen geçerli bir Türkiye telefon numarası girin (örn: 905551234567, 05551234567, 551234567)`);
}

/**
 * CepSMS API ile SMS gönder
 */
export async function sendSMS(phone: string, message: string): Promise<SendSMSResult> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    console.log('[CepSMS] SMS gönderiliyor:', {
      phone: formattedPhone,
      messageLength: message.length,
      from: CEPSMS_FROM,
      username: CEPSMS_USERNAME,
    });

    // CepSMS API isteği - From parametresi opsiyonel ve bazı hesaplarda geçersiz olabilir
    const requestData: any = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      Message: message,
      Numbers: [formattedPhone],
    };

    // From parametresi sadece geçerli bir değer varsa ekle
    // CepSMS hesabında kayıtlı gönderen adı yoksa From parametresini kaldır
    if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
      requestData.From = CEPSMS_FROM;
    }

    const response = await axios.post<CepSMSResponse>(
      CEPSMS_API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 30000, // 30 saniye timeout
      }
    );

    console.log('[CepSMS] API Yanıtı:', JSON.stringify(response.data, null, 2));

    // API yanıtını kontrol et
    if (!response.data) {
      return {
        success: false,
        error: 'API yanıtı alınamadı',
      };
    }

    // Status kontrolü - farklı formatlar olabilir
    const status = response.data.Status || response.data.status || response.data.statusCode;
    const messageId = response.data.MessageId || response.data.messageId || response.data.id;
    const error = response.data.Error || response.data.error || response.data.message;

    // Başarılı yanıt kontrolü
    const statusStr = String(status || '').toUpperCase();
    const isSuccess = statusStr === 'OK' || status === 200;
    
    if (isSuccess && messageId) {
      console.log('[CepSMS] SMS başarıyla gönderildi:', messageId);
      return {
        success: true,
        messageId: String(messageId),
      };
    }

    // Hata varsa göster
    const errorMessage = error || `Status: ${status}, MessageId: ${messageId || 'yok'}`;
    console.error('[CepSMS] SMS gönderim hatası:', errorMessage);
    
    return {
      success: false,
      error: errorMessage || 'Bilinmeyen hata - API yanıtı beklenmedik formatta',
    };
  } catch (error: any) {
    console.error('[CepSMS] SMS gönderim hatası (catch):', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
    });

    // Axios hata yanıtı varsa
    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = errorData?.Error || errorData?.error || errorData?.message || error.message;
      return {
        success: false,
        error: errorMessage || `HTTP ${error.response.status}: ${error.response.statusText}`,
      };
    }

    // Network hatası
    if (error.request) {
      return {
        success: false,
        error: 'API\'ye bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
      };
    }

    // Diğer hatalar
    return {
      success: false,
      error: error.message || 'SMS gönderim hatası',
    };
  }
}

/**
 * CepSMS API'den mesaj durumunu kontrol et
 * Not: CepSMS API dokümantasyonuna göre endpoint değişebilir
 * Genellikle /status veya /report endpoint'i kullanılır
 */
export async function checkSMSStatus(messageId: string): Promise<{
  success: boolean;
  status?: 'sent' | 'delivered' | 'failed' | 'pending';
  error?: string;
}> {
  try {
    console.log('[CepSMS] Mesaj durumu kontrol ediliyor:', { messageId });

    // CepSMS API'de mesaj durumu sorgulama endpoint'i
    // Genellikle /status veya /report endpoint'i kullanılır
    // CepSMS API dokümantasyonuna göre endpoint değişebilir
    // Önce /status endpoint'ini dene, yoksa /report dene
    const statusUrl = CEPSMS_API_URL.replace('/smsapi', '/status') || `${CEPSMS_API_URL.replace('/smsapi', '')}/status`;
    
    const requestData = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      MessageId: messageId,
    };

    try {
      const response = await axios.post<any>(
        statusUrl,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          httpsAgent: httpsAgent,
          timeout: 30000,
        }
      );

      console.log('[CepSMS] Durum API Yanıtı:', JSON.stringify(response.data, null, 2));

      if (!response.data) {
        return {
          success: false,
          status: 'pending',
          error: 'API yanıtı alınamadı',
        };
      }

      // Durum kontrolü - farklı formatlar olabilir
      const status = response.data.Status || response.data.status || response.data.DeliveryStatus || response.data.deliveryStatus;
      const statusStr = String(status || '').toLowerCase();

      // Durum eşleştirmesi
      if (statusStr.includes('delivered') || statusStr.includes('iletildi') || statusStr === '1' || statusStr === 'ok' || statusStr === 'success') {
        return {
          success: true,
          status: 'delivered',
        };
      } else if (statusStr.includes('failed') || statusStr.includes('iletilmedi') || statusStr.includes('undelivered') || statusStr === '0' || statusStr === 'error') {
        return {
          success: true,
          status: 'failed',
        };
      } else if (statusStr.includes('sent') || statusStr.includes('gönderildi') || statusStr === 'pending' || statusStr === 'processing') {
        return {
          success: true,
          status: 'sent',
        };
      }

      // Bilinmeyen durum
      return {
        success: true,
        status: 'pending',
      };
    } catch (statusError: any) {
      // /status endpoint'i yoksa /report endpoint'ini dene
      console.log('[CepSMS] /status endpoint bulunamadı, /report deneniyor...');
      
      const reportUrl = CEPSMS_API_URL.replace('/smsapi', '/report') || `${CEPSMS_API_URL.replace('/smsapi', '')}/report`;
      
      try {
        const reportResponse = await axios.post<any>(
          reportUrl,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            httpsAgent: httpsAgent,
            timeout: 30000,
          }
        );

        console.log('[CepSMS] Report API Yanıtı:', JSON.stringify(reportResponse.data, null, 2));

        if (!reportResponse.data) {
          return {
            success: false,
            status: 'pending',
            error: 'API yanıtı alınamadı',
          };
        }

        // Durum kontrolü
        const status = reportResponse.data.Status || reportResponse.data.status || reportResponse.data.DeliveryStatus || reportResponse.data.deliveryStatus;
        const statusStr = String(status || '').toLowerCase();

        if (statusStr.includes('delivered') || statusStr.includes('iletildi') || statusStr === '1' || statusStr === 'ok') {
          return {
            success: true,
            status: 'delivered',
          };
        } else if (statusStr.includes('failed') || statusStr.includes('iletilmedi') || statusStr.includes('undelivered') || statusStr === '0') {
          return {
            success: true,
            status: 'failed',
          };
        }

        return {
          success: true,
          status: 'pending',
        };
      } catch (reportError: any) {
        // Her iki endpoint de çalışmıyorsa, pending döndür
        console.warn('[CepSMS] Durum kontrolü yapılamadı, mesaj durumu bilinmiyor:', reportError.message);
        return {
          success: false,
          status: 'pending',
          error: 'Durum kontrolü yapılamadı - API endpoint bulunamadı',
        };
      }
    }
  } catch (error: any) {
    console.error('[CepSMS] Durum kontrolü hatası:', error);

    // API endpoint bulunamadıysa veya hata varsa, pending döndür
    // Bu durumda manuel kontrol gerekebilir
    return {
      success: false,
      status: 'pending',
      error: error.message || 'Durum kontrolü yapılamadı',
    };
  }
}

/**
 * Toplu SMS gönder
 */
export async function sendBulkSMS(phones: string[], message: string): Promise<SendSMSResult[]> {
  const results: SendSMSResult[] = [];
  
  for (const phone of phones) {
    const result = await sendSMS(phone, message);
    results.push(result);
  }
  
  return results;
}

