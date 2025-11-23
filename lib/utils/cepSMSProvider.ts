import axios from 'axios';
import https from 'https';
import FormData from 'form-data';

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

const CEPSMS_USERNAME = process.env.CEPSMS_USERNAME || 'Szxx';
const CEPSMS_PASSWORD = process.env.CEPSMS_PASSWORD || 'KepdaKeoz7289';
const CEPSMS_FROM = process.env.CEPSMS_FROM || 'CepSMS';
const CEPSMS_API_URL = 'https://panel4.cepsms.com/smsapi';
// CepSMS MULTI endpoint - aynı endpoint, sadece format farklı (Messages array kullanılıyor)
// Bazı CepSMS versiyonlarında /multi endpoint'i olabilir, ama genelde aynı endpoint kullanılır
const CEPSMS_MULTI_API_URL = 'https://panel4.cepsms.com/smsapi';

// HTTPS agent - SSL sertifika doğrulamasını atla (development için)
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
});

/**
 * Telefon numarasını CepSMS formatına dönüştür (905xxxxxxxxx - 12 haneli)
 * Tüm geçerli formatları otomatik olarak 905551234567 formatına çevirir
 */
export function formatPhoneNumber(phone: string): string {
  // Sadece rakamları al
  let cleaned = phone.replace(/\D/g, '');
  
  // Boş veya çok kısa numaralar
  if (!cleaned || cleaned.length < 9) {
    throw new Error(`Geçersiz telefon numarası: ${phone} (çok kısa, minimum 9 hane olmalı)`);
  }
  
  // Çok uzun numaralar (14+ hane) - ilk 12 haneyi al
  if (cleaned.length > 13) {
    cleaned = cleaned.substring(0, 13);
  }
  
  // 12 haneli ve 905 ile başlıyorsa (905xxxxxxxxx) - bu geçerli bir format
  // Örnek: 905551234567 (905 + 9 hane = 12 hane)
  if (cleaned.length === 12 && cleaned.startsWith('905')) {
    // Geçerliliği kontrol et: 905 + 9 hane daha olmalı (toplam 12 hane)
    if (/^905\d{9}$/.test(cleaned)) {
      return cleaned;
    }
  }
  
  // 13 haneli ve 905 ile başlıyorsa - ilk 12 haneyi al
  if (cleaned.length === 13 && cleaned.startsWith('905')) {
    const twelveDigits = cleaned.substring(0, 12);
    if (/^905\d{9}$/.test(twelveDigits)) {
      return twelveDigits;
    }
  }
  
  // 11 haneli ve 05 ile başlıyorsa (05xxxxxxxxx) - 0'ı kaldır ve 90 ekle
  // Örnek: 05075708797 -> 05075708797 -> 5075708797 -> 905075708797 (12 hane)
  if (cleaned.length === 11 && cleaned.startsWith('05')) {
    const withoutZero = cleaned.substring(1); // 0'ı kaldır -> 5075708797 (10 hane)
    if (withoutZero.length === 10 && withoutZero.startsWith('5')) {
      return '90' + withoutZero; // 905075708797 (12 hane)
    }
  }
  
  // 10 haneli ve 05 ile başlıyorsa (05xxxxxxxxx) - 0'ı kaldır ve 90 ekle
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    const withoutZero = cleaned.substring(1); // 0'ı kaldır
    if (withoutZero.length === 9 && withoutZero.startsWith('5')) {
      return '90' + withoutZero; // 905xxxxxxxxx (12 hane)
    }
  }
  
  // 11 haneli ve 90 ile başlıyorsa ama 905 ile başlamıyorsa
  // Örnek: 9075708797 -> 905075708797 (başına 5 ekle, toplam 12 hane olmalı)
  if (cleaned.length === 11 && cleaned.startsWith('90') && !cleaned.startsWith('905')) {
    // İlk 2 haneyi (90) kaldır, kalan 9 haneyi al ve başına 905 ekle
    const without90 = cleaned.substring(2); // 75708797 (9 hane)
    if (without90.length === 9 && without90.startsWith('5')) {
      return '905' + without90; // 90575708797 (12 hane)
    }
  }
  
  // 10 haneli ve 5 ile başlıyorsa (5xxxxxxxxx) - 90 ekle
  // Örnek: 575708797 -> 90575708797 (12 hane)
  // Örnek: 5075708797 -> 905075708797 (12 hane) - Bu format için özel kontrol
  if (cleaned.length === 10 && cleaned.startsWith('5')) {
    return '90' + cleaned; // 905xxxxxxxxx (12 hane)
  }
  
  // 11 haneli ve 5 ile başlıyorsa (5xxxxxxxxxx) - ilk 10 haneyi al ve 90 ekle
  // Örnek: 50757087971 -> ilk 10 hane: 5075708797 -> 905075708797 (12 hane)
  if (cleaned.length === 11 && cleaned.startsWith('5')) {
    const firstTen = cleaned.substring(0, 10);
    if (firstTen.startsWith('5')) {
      return '90' + firstTen; // 905xxxxxxxxx (12 hane)
    }
  }
  
  // 9 haneli ve 5 ile başlıyorsa (5xxxxxxxx) - 90 ekle (mobil numaralar)
  // Örnek: 75708797 -> 90575708797 (12 hane)
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    return '90' + cleaned; // 905xxxxxxxxx (12 hane)
  }
  
  // Eğer hala formatlanamadıysa hata ver
  throw new Error(`Geçersiz telefon numarası formatı: ${phone} (${cleaned.length} hane). Geçerli formatlar: 905551234567, 05551234567, 05075708797, 551234567, 575708797`);
}

/**
 * CepSMS API ile SMS gönder
 */
export async function sendSMS(phone: string, message: string): Promise<SendSMSResult> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    console.log('[CepSMS] SMS gönderiliyor:', {
      originalPhone: phone,
      formattedPhone: formattedPhone,
      messageLength: message.length,
      messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      from: CEPSMS_FROM,
      username: CEPSMS_USERNAME,
      apiUrl: CEPSMS_API_URL,
    });

    // CepSMS API isteği - Test sonuçlarına göre Numbers (array) formatı çalışıyor
    // Format: { User, Pass, Message, Numbers: [phone] }
    const requestData: any = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      Message: message,
      Numbers: [formattedPhone], // CepSMS API Numbers array formatını bekliyor
    };

    // From parametresi CepSMS hesabında kayıtlı gönderen adı varsa eklenebilir
    // Ama test sonuçlarına göre gerekli değil (Numbers array formatı çalışıyor)
    // if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
    //   requestData.From = CEPSMS_FROM;
    // }

    console.log('[CepSMS] API İsteği:', {
      url: CEPSMS_API_URL,
      requestData: {
        ...requestData,
        Pass: '***', // Şifreyi log'da gösterme
      },
    });

    // CepSMS API'ye istek gönder - Numbers array formatı
    const response = await axios.post<CepSMSResponse>(
      CEPSMS_API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 30000,
        validateStatus: function (status) {
          // 200 status kodunu kabul et (API 200 döndürüyor, başarı/başarısızlık response.data.Status'ta)
          return status === 200;
        },
      }
    );

    console.log('[CepSMS] API Yanıtı:', JSON.stringify(response.data, null, 2));

    // API yanıtını kontrol et
    if (!response.data) {
      console.error('[CepSMS] API yanıtı boş!');
      return {
        success: false,
        error: 'API yanıtı alınamadı',
      };
    }

    // CepSMS API yanıt formatı: { MessageId: number, Status: string }
    // Test sonuçlarına göre:
    // Başarılı: { MessageId: 71222774469, Status: "OK" }
    // Başarısız: { MessageId: 0, Status: "System Error" }
    const status = response.data.Status || response.data.status;
    const messageId = response.data.MessageId || response.data.messageId;

    console.log('[CepSMS] Parse Edilen Değerler:', {
      status,
      messageId,
      rawData: response.data
    });

    // Başarılı yanıt kontrolü
    const statusStr = String(status || '').toUpperCase();
    const messageIdValue = messageId ? Number(messageId) : 0;
    
    // Başarı kriterleri:
    // 1. Status "OK" ise
    // 2. MessageId > 0 ise (0 = hata, > 0 = başarılı)
    const isSuccess = statusStr === 'OK' && messageIdValue > 0;
    
    console.log('[CepSMS] Başarı Kontrolü:', {
      statusStr,
      messageId: messageIdValue,
      isSuccess,
    });
    
    if (isSuccess) {
      console.log('[CepSMS] ✅ SMS başarıyla gönderildi:', {
        messageId: String(messageIdValue),
        phone: formattedPhone,
        status: statusStr
      });
      return {
        success: true,
        messageId: String(messageIdValue),
      };
    }

    // Hata durumu
    const errorMessage = response.data.Error || response.data.error || `API yanıt hatası: Status=${statusStr}, MessageId=${messageIdValue}`;
    console.error('[CepSMS] ❌ SMS gönderim başarısız:', {
      error: errorMessage,
      status: statusStr,
      messageId: messageIdValue,
      rawResponse: response.data
    });
    
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error: any) {
    console.error('[CepSMS] SMS gönderim hatası (catch):', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
      request: error.config ? {
        url: error.config.url,
        method: error.config.method,
        data: error.config.data,
      } : null,
    });

    // Axios hata yanıtı varsa
    if (error.response) {
      const errorData = error.response.data;
      let errorMessage = '';
      
      // 400 Bad Request - detaylı hata mesajı göster
      if (error.response.status === 400) {
        if (typeof errorData === 'string') {
          errorMessage = `Bad Request (400): ${errorData}`;
        } else if (errorData?.Error || errorData?.error || errorData?.message) {
          errorMessage = `Bad Request (400): ${errorData.Error || errorData.error || errorData.message}`;
        } else {
          errorMessage = `Bad Request (400): API geçersiz istek hatası. Muhtemelen eksik/hatalı parametre veya geçersiz telefon numarası formatı.`;
        }
      } else {
        errorMessage = errorData?.Error || errorData?.error || errorData?.message || error.message;
      }
      
      // Eğer hala mesaj yoksa genel mesaj ver
      if (!errorMessage) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      }
      
      // Detaylı log
      console.error('[CepSMS] API Hata Detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        errorData: JSON.stringify(errorData),
        errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Network hatası
    if (error.request) {
      console.error('[CepSMS] Network hatası - API\'ye ulaşılamadı');
      return {
        success: false,
        error: 'API\'ye bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
      };
    }

    // Diğer hatalar
    console.error('[CepSMS] Genel hata:', error.message);
    return {
      success: false,
      error: error.message || 'SMS gönderim hatası',
    };
  }
}

/**
 * CepSMS API'den mesaj durumunu kontrol et
 * CepSMS API dokümantasyonuna göre SMS Report endpoint'i kullanılır
 */
export async function checkSMSStatus(messageId: string, phoneNumber?: string): Promise<{
  success: boolean;
  status?: 'gönderildi' | 'iletildi' | 'iletilmedi' | 'rapor_bekliyor' | 'zaman_aşımı';
  network?: string;
  error?: string;
}> {
  try {
    console.log('[CepSMS] Mesaj durumu kontrol ediliyor:', { messageId, phoneNumber });

    // CepSMS API SMS Report endpoint'i - resmi dokümana göre JSON POST
    const normalizedBaseUrl = CEPSMS_API_URL.replace(/\/$/, '');
    const candidateEndpoints = Array.from(
      new Set(
        [
          normalizedBaseUrl,
          `${normalizedBaseUrl}/report`,
          normalizedBaseUrl.endsWith('/smsapi')
            ? `${normalizedBaseUrl.replace('/smsapi', '')}/report`
            : `${normalizedBaseUrl}/report`,
          'https://panel4.cepsms.com/smsapi',
          'https://panel4.cepsms.com/smsapi/report',
          'https://panel4.cepsms.com/report',
        ].filter(Boolean)
      )
    );

    const requestPayload = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      MessageId: messageId,
    };

    let response: any = null;
    let lastError: any = null;

    for (const endpoint of candidateEndpoints) {
      try {
        console.log('[CepSMS] Rapor API isteği:', { endpoint, messageId });

        // İlk denemede JSON formatı kullan, HTML dönerse form-encoded ile tekrar dene
        response = await axios.post<any>(endpoint, requestPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 30000,
        });

        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          console.warn('[CepSMS] HTML yanıt alındı, form-encoded denenecek');

          response = await axios.post<any>(endpoint, new URLSearchParams(requestPayload as any).toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            httpsAgent,
            timeout: 30000,
          });

          if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            console.warn('[CepSMS] HTML yanıt devam ediyor, bir sonraki endpoint denenecek');
            lastError = new Error('HTML response received');
            continue;
          }
        }

        break; // Başarılı yanıt
      } catch (error: any) {
        lastError = error;
        console.warn('[CepSMS] Rapor endpoint denemesi başarısız:', {
          endpoint,
          message: error.message,
          status: error.response?.status,
          data: typeof error.response?.data === 'string' ? error.response.data.substring(0, 200) : error.response?.data,
        });
      }
    }

    if (!response) {
      console.error('[CepSMS] Rapor endpoint\'lerine ulaşılamadı');
      return {
        success: false,
        status: 'rapor_bekliyor',
        error: lastError?.message || 'CepSMS rapor endpoint\'i bulunamadı',
      };
    }

    console.log('[CepSMS] Rapor API Yanıtı:', JSON.stringify(response.data, null, 2));

    if (!response.data) {
      return {
        success: false,
        status: 'rapor_bekliyor',
        error: 'API yanıtı alınamadı',
      };
    }

    // Status kontrolü
    const apiStatus = response.data.Status || response.data.status;
    const statusStr = String(apiStatus || '').toUpperCase();

    // API hatası varsa
    if (statusStr === 'ERROR' || statusStr === 'HATA') {
      return {
        success: false,
        status: 'rapor_bekliyor',
        error: 'API hatası',
      };
    }

    // Report array'i kontrol et
    const report = response.data.Report || response.data.report || [];
    
    if (!Array.isArray(report) || report.length === 0) {
      return {
        success: true,
        status: 'rapor_bekliyor',
      };
    }

    // Telefon numarası belirtilmişse, o numaraya ait raporu bul
    if (phoneNumber) {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const phoneReport = report.find((r: any) => {
        const reportPhone = r.GSM || r.gsm || r.phone;
        return reportPhone === formattedPhone || reportPhone === phoneNumber;
      });

      if (phoneReport) {
        const state = phoneReport.State || phoneReport.state || phoneReport.status || '';
        const network = phoneReport.Network || phoneReport.network || '';
        
        // Durum eşleştirmesi (Türkçe)
        let status: 'gönderildi' | 'iletildi' | 'iletilmedi' | 'rapor_bekliyor' | 'zaman_aşımı' = 'rapor_bekliyor';
        
        if (state === 'İletildi' || state === 'iletildi' || state.toLowerCase().includes('iletildi')) {
          status = 'iletildi';
        } else if (state === 'İletilmedi' || state === 'iletilmedi' || state.toLowerCase().includes('iletilmedi')) {
          status = 'iletilmedi';
        } else if (state === 'Zaman Aşımı' || state === 'zaman aşımı' || state.toLowerCase().includes('zaman aşımı') || state.toLowerCase().includes('timeout')) {
          status = 'zaman_aşımı';
        } else if (state === 'Rapor Bekliyor' || state === 'rapor bekliyor' || state.toLowerCase().includes('rapor bekliyor') || state.toLowerCase().includes('pending')) {
          status = 'rapor_bekliyor';
        }

        return {
          success: true,
          status,
          network,
        };
      }
    }

    // Telefon numarası belirtilmemişse, ilk raporu kullan
    const firstReport = report[0];
    if (firstReport) {
      const state = firstReport.State || firstReport.state || firstReport.status || '';
      const network = firstReport.Network || firstReport.network || '';
      
      // Durum eşleştirmesi (Türkçe)
      let status: 'gönderildi' | 'iletildi' | 'iletilmedi' | 'rapor_bekliyor' | 'zaman_aşımı' = 'rapor_bekliyor';
      
      if (state === 'İletildi' || state === 'iletildi' || state.toLowerCase().includes('iletildi')) {
        status = 'iletildi';
      } else if (state === 'İletilmedi' || state === 'iletilmedi' || state.toLowerCase().includes('iletilmedi')) {
        status = 'iletilmedi';
      } else if (state === 'Zaman Aşımı' || state === 'zaman aşımı' || state.toLowerCase().includes('zaman aşımı') || state.toLowerCase().includes('timeout')) {
        status = 'zaman_aşımı';
      } else if (state === 'Rapor Bekliyor' || state === 'rapor bekliyor' || state.toLowerCase().includes('rapor bekliyor') || state.toLowerCase().includes('pending')) {
        status = 'rapor_bekliyor';
      }

      return {
        success: true,
        status,
        network,
      };
    }

    // Rapor bulunamadı
    return {
      success: true,
      status: 'rapor_bekliyor',
    };
  } catch (error: any) {
    console.error('[CepSMS] Durum kontrolü hatası:', {
      message: error.message,
      stack: error.stack,
    });

    // API endpoint bulunamadıysa veya hata varsa, rapor bekliyor döndür
    return {
      success: false,
      status: 'rapor_bekliyor',
      error: error.message || 'Durum kontrolü yapılamadı',
    };
  }
}

/**
 * Toplu SMS gönder - CepSMS API'nin toplu gönderim özelliğini kullanır
 * Birden fazla numarayı tek bir API çağrısıyla gönderir (daha hızlı)
 */
export async function sendBulkSMS(phones: string[], message: string): Promise<SendSMSResult[]> {
  if (!phones || phones.length === 0) {
    return [];
  }

  // CepSMS API'si muhtemelen çok fazla numarayı tek seferde kabul etmiyor
  // Bu yüzden önce tek tek göndermeyi deniyoruz (paralel olarak)
  // Eğer gerçekten toplu gönderim destekleniyorsa, daha küçük batch'ler deneyebiliriz
  
  // Tüm numaralar zaten formatlanmış olmalı, ama yine de kontrol edelim
  const formattedPhones: string[] = [];
  const errors: Array<{ phone: string; error: string }> = [];
  
  for (const phone of phones) {
    try {
      const formatted = formatPhoneNumber(phone);
      formattedPhones.push(formatted);
    } catch (error: any) {
      errors.push({ phone, error: error.message });
    }
  }

  // Eğer tüm numaralar geçersizse hata döndür
  if (formattedPhones.length === 0) {
    return phones.map(phone => ({
      success: false,
      error: 'Geçersiz telefon numarası formatı',
    }));
  }

  // CepSMS API'nin MULTI formatını kullanarak toplu gönderim yap
  // MULTI format: Messages array içinde her numara için Message ve GSM
  console.log('[CepSMS] Toplu SMS gönderiliyor (MULTI format):', {
    numaraSayısı: formattedPhones.length,
    messageLength: message.length,
  });

  try {
    // MULTI format isteği hazırla
    const requestData: any = {
      User: CEPSMS_USERNAME,
      Pass: CEPSMS_PASSWORD,
      Coding: 'default',
      StartDate: null,
      ValidityPeriod: 1440,
      Messages: formattedPhones.map(phone => ({
        Message: message,
        GSM: phone,
      })),
    };

    // From parametresi sadece geçerli bir değer varsa ekle
    if (CEPSMS_FROM && CEPSMS_FROM.trim() !== '' && CEPSMS_FROM !== 'CepSMS') {
      requestData.From = CEPSMS_FROM;
    }

    console.log('[CepSMS] MULTI API İsteği:', {
      url: CEPSMS_MULTI_API_URL,
      numaraSayısı: formattedPhones.length,
      requestData: {
        ...requestData,
        Pass: '***', // Şifreyi log'da gösterme
        Messages: `[${formattedPhones.length} mesaj]`, // Array'i log'da gösterme
      },
    });

    const response = await axios.post<CepSMSResponse>(
      CEPSMS_MULTI_API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        httpsAgent: httpsAgent,
        timeout: 60000, // Toplu gönderim için daha uzun timeout (60 saniye)
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
      }
    );

    console.log('[CepSMS] MULTI API Yanıtı:', JSON.stringify(response.data, null, 2));

    // API yanıtını kontrol et
    if (!response.data) {
      console.error('[CepSMS] MULTI API yanıtı boş!');
      // Fallback: Paralel tek tek gönder
      return await sendBulkSMSParallel(formattedPhones, message, errors);
    }

    // MULTI API yanıtı genellikle MessageIds array döner
    const status = response.data.Status || response.data.status || response.data.statusCode;
    const messageIds = response.data.MessageIds || response.data.messageIds || [];
    const error = response.data.Error || response.data.error || response.data.message || response.data.Message;

    const statusStr = String(status || '').toUpperCase();
    const isSuccess = 
      statusStr === 'OK' || 
      status === 200 || 
      statusStr === 'SUCCESS' ||
      (messageIds.length > 0 && !error && statusStr !== 'ERROR' && statusStr !== 'HATA' && statusStr !== 'FAIL');

    console.log('[CepSMS] MULTI Başarı Kontrolü:', {
      statusStr,
      messageIds: messageIds.length,
      error,
      isSuccess,
    });

    if (isSuccess && messageIds.length > 0) {
      console.log('[CepSMS] ✅ MULTI SMS başarıyla gönderildi:', {
        toplamNumara: formattedPhones.length,
        messageIdSayısı: messageIds.length,
      });

      // Her numara için sonuç oluştur
      const results: SendSMSResult[] = [];
      
      for (let i = 0; i < formattedPhones.length; i++) {
        // Eğer her numara için ayrı messageId varsa, o kullan
        // Yoksa, ilk messageId'yi kullan (bazı API'ler batch için tek ID döner)
        const assignedMessageId = messageIds[i] || messageIds[0];
        results.push({
          success: true,
          messageId: assignedMessageId ? String(assignedMessageId) : undefined,
        });
      }

      // Formatlama hatası olan numaraları ekle
      for (const err of errors) {
        results.push({
          success: false,
          error: err.error,
        });
      }

      return results;
    }

    // MULTI API başarısız oldu, fallback: Paralel tek tek gönder
    const errorMessage = error || `Status: ${status}`;
    console.warn('[CepSMS] ⚠️ MULTI API başarısız, paralel tek tek gönderime geçiliyor:', errorMessage);
    return await sendBulkSMSParallel(formattedPhones, message, errors);

  } catch (error: any) {
    console.error('[CepSMS] MULTI API hatası (catch), paralel tek tek gönderime geçiliyor:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Fallback: Paralel tek tek gönder
    return await sendBulkSMSParallel(formattedPhones, message, errors);
  }
}

/**
 * Paralel olarak tek tek SMS gönder (fallback method)
 */
async function sendBulkSMSParallel(
  formattedPhones: string[], 
  message: string, 
  errors: Array<{ phone: string; error: string }>
): Promise<SendSMSResult[]> {
  console.log('[CepSMS] Paralel tek tek SMS gönderiliyor (fallback):', {
    numaraSayısı: formattedPhones.length,
  });

  // Paralel olarak gönder (aynı anda en fazla 20)
  const CONCURRENT_LIMIT = 20;
  const results: SendSMSResult[] = [];
  
  for (let i = 0; i < formattedPhones.length; i += CONCURRENT_LIMIT) {
    const batch = formattedPhones.slice(i, i + CONCURRENT_LIMIT);
    
    const batchPromises = batch.map(async (phone) => {
      try {
        return await sendSMS(phone, message);
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'SMS gönderim hatası',
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting için küçük bekleme (her batch sonrası)
    if (i + CONCURRENT_LIMIT < formattedPhones.length) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms bekle
    }
  }

  // Formatlama hatası olan numaraları ekle
  for (const err of errors) {
    results.push({
      success: false,
      error: err.error,
    });
  }

  return results;
}

