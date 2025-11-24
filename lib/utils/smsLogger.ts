import { getSupabaseServer } from '@/lib/supabase-server';

export interface SMSLogEntry {
  id?: string;
  sms_message_id?: string; // sms_messages tablosundaki ID
  user_id?: string;
  phone_number: string;
  message?: string;
  message_preview?: string; // Mesajın ilk 100 karakteri
  log_type: 'send_request' | 'send_response' | 'send_error' | 'status_check' | 'status_update' | 'credit_deduction' | 'credit_refund' | 'database_insert' | 'database_error' | 'system_error';
  log_level: 'info' | 'warning' | 'error' | 'success';
  status?: string; // SMS durumu
  cep_sms_message_id?: string; // CepSMS MessageId
  credit_amount?: number;
  request_data?: any; // API request bilgileri
  response_data?: any; // API response bilgileri
  error_message?: string;
  error_stack?: string;
  duration_ms?: number; // İşlem süresi (milisaniye)
  endpoint?: string; // Kullanılan endpoint
  ip_address?: string;
  user_agent?: string;
  metadata?: any; // Ek bilgiler (JSON)
  created_at?: string;
}

/**
 * SMS Log kaydı oluştur
 * Her SMS işlemi için detaylı log kaydı tutar
 */
export async function createSMSLog(logEntry: SMSLogEntry): Promise<string | null> {
  try {
    const logData = {
      sms_message_id: logEntry.sms_message_id || null,
      user_id: logEntry.user_id || null,
      phone_number: logEntry.phone_number,
      message: logEntry.message || null,
      message_preview: logEntry.message_preview || (logEntry.message ? logEntry.message.substring(0, 100) : null),
      log_type: logEntry.log_type,
      log_level: logEntry.log_level,
      status: logEntry.status || null,
      cep_sms_message_id: logEntry.cep_sms_message_id || null,
      credit_amount: logEntry.credit_amount || null,
      request_data: logEntry.request_data ? JSON.stringify(logEntry.request_data) : null,
      response_data: logEntry.response_data ? JSON.stringify(logEntry.response_data) : null,
      error_message: logEntry.error_message || null,
      error_stack: logEntry.error_stack || null,
      duration_ms: logEntry.duration_ms || null,
      endpoint: logEntry.endpoint || null,
      ip_address: logEntry.ip_address || null,
      user_agent: logEntry.user_agent || null,
      metadata: logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
      created_at: new Date().toISOString(),
    };

    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from('sms_logs')
      .insert(logData)
      .select('id')
      .single();

    if (error) {
      console.error('[SMS Logger] Log kaydı oluşturulamadı:', error);
      // Kritik değil, sadece console'a yazdır (log sistemi kendisi hata verirse döngüye girmemek için)
      return null;
    }

    return data?.id || null;
  } catch (error: any) {
    console.error('[SMS Logger] Log kaydı oluşturma hatası:', error);
    return null;
  }
}

/**
 * SMS gönderim isteği logu
 */
export async function logSendRequest(params: {
  userId?: string;
  phoneNumber: string;
  message: string;
  endpoint?: string;
  requestData?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string | null> {
  return await createSMSLog({
    phone_number: params.phoneNumber,
    message: params.message,
    message_preview: params.message.substring(0, 100),
    user_id: params.userId,
    log_type: 'send_request',
    log_level: 'info',
    endpoint: params.endpoint,
    request_data: params.requestData,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  });
}

/**
 * SMS gönderim yanıtı logu
 */
export async function logSendResponse(params: {
  logId?: string;
  smsMessageId?: string;
  userId?: string;
  phoneNumber: string;
  message?: string;
  status: string;
  cepSmsMessageId?: string;
  responseData?: any;
  durationMs?: number;
  success: boolean;
}): Promise<string | null> {
  return await createSMSLog({
    sms_message_id: params.smsMessageId,
    phone_number: params.phoneNumber,
    message: params.message,
    user_id: params.userId,
    log_type: 'send_response',
    log_level: params.success ? 'success' : 'error',
    status: params.status,
    cep_sms_message_id: params.cepSmsMessageId,
    response_data: params.responseData,
    duration_ms: params.durationMs,
    error_message: params.success ? undefined : 'SMS gönderim başarısız',
  });
}

/**
 * SMS gönderim hatası logu
 */
export async function logSendError(params: {
  userId?: string;
  phoneNumber: string;
  message?: string;
  error: Error | string;
  endpoint?: string;
  requestData?: any;
}): Promise<string | null> {
  const errorMessage = typeof params.error === 'string' ? params.error : params.error.message;
  const errorStack = typeof params.error === 'string' ? undefined : params.error.stack;

  return await createSMSLog({
    phone_number: params.phoneNumber,
    message: params.message,
    message_preview: params.message ? params.message.substring(0, 100) : undefined,
    user_id: params.userId,
    log_type: 'send_error',
    log_level: 'error',
    endpoint: params.endpoint,
    request_data: params.requestData,
    error_message: errorMessage,
    error_stack: errorStack,
  });
}

/**
 * Kredi düşme logu
 */
export async function logCreditDeduction(params: {
  userId: string;
  phoneNumber?: string;
  smsMessageId?: string;
  amount: number;
  beforeCredit: number;
  afterCredit: number;
  systemCreditBefore?: number;
  systemCreditAfter?: number;
  metadata?: any;
}): Promise<string | null> {
  return await createSMSLog({
    sms_message_id: params.smsMessageId,
    phone_number: params.phoneNumber || 'bulk',
    user_id: params.userId,
    log_type: 'credit_deduction',
    log_level: 'info',
    credit_amount: params.amount,
    metadata: {
      beforeCredit: params.beforeCredit,
      afterCredit: params.afterCredit,
      systemCreditBefore: params.systemCreditBefore,
      systemCreditAfter: params.systemCreditAfter,
      ...params.metadata,
    },
  });
}

/**
 * Kredi iade logu
 */
export async function logCreditRefund(params: {
  userId: string;
  phoneNumber?: string;
  smsMessageId?: string;
  amount: number;
  reason: string;
  metadata?: any;
}): Promise<string | null> {
  return await createSMSLog({
    sms_message_id: params.smsMessageId,
    phone_number: params.phoneNumber || 'bulk',
    user_id: params.userId,
    log_type: 'credit_refund',
    log_level: 'info',
    credit_amount: params.amount,
    error_message: params.reason,
    metadata: params.metadata,
  });
}

/**
 * Durum kontrolü logu
 */
export async function logStatusCheck(params: {
  smsMessageId: string;
  phoneNumber?: string;
  cepSmsMessageId: string;
  oldStatus?: string;
  newStatus?: string;
  network?: string;
  durationMs?: number;
  success: boolean;
  error?: string;
}): Promise<string | null> {
  return await createSMSLog({
    sms_message_id: params.smsMessageId,
    phone_number: params.phoneNumber || '',
    log_type: 'status_check',
    log_level: params.success ? 'info' : 'warning',
    status: params.newStatus || params.oldStatus,
    cep_sms_message_id: params.cepSmsMessageId,
    duration_ms: params.durationMs,
    error_message: params.error,
    metadata: {
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      network: params.network,
    },
  });
}

/**
 * Durum güncelleme logu
 */
export async function logStatusUpdate(params: {
  smsMessageId: string;
  phoneNumber?: string;
  oldStatus: string;
  newStatus: string;
  network?: string;
}): Promise<string | null> {
  return await createSMSLog({
    sms_message_id: params.smsMessageId,
    phone_number: params.phoneNumber || '',
    log_type: 'status_update',
    log_level: 'info',
    status: params.newStatus,
    metadata: {
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      network: params.network,
    },
  });
}

/**
 * Veritabanı işlemi logu
 */
export async function logDatabaseOperation(params: {
  operation: 'insert' | 'update' | 'delete';
  smsMessageId?: string;
  userId?: string;
  phoneNumber?: string;
  success: boolean;
  error?: string;
  metadata?: any;
}): Promise<string | null> {
  return await createSMSLog({
    sms_message_id: params.smsMessageId,
    phone_number: params.phoneNumber || '',
    user_id: params.userId,
    log_type: params.success ? 'database_insert' : 'database_error',
    log_level: params.success ? 'info' : 'error',
    error_message: params.error,
    metadata: params.metadata,
  });
}

/**
 * Toplu log oluştur (bulk insert için performans)
 */
export async function createBulkSMSLogs(logEntries: SMSLogEntry[]): Promise<number> {
  try {
    if (!logEntries || logEntries.length === 0) {
      return 0;
    }

    const logData = logEntries.map(logEntry => ({
      sms_message_id: logEntry.sms_message_id || null,
      user_id: logEntry.user_id || null,
      phone_number: logEntry.phone_number,
      message: logEntry.message || null,
      message_preview: logEntry.message_preview || (logEntry.message ? logEntry.message.substring(0, 100) : null),
      log_type: logEntry.log_type,
      log_level: logEntry.log_level,
      status: logEntry.status || null,
      cep_sms_message_id: logEntry.cep_sms_message_id || null,
      credit_amount: logEntry.credit_amount || null,
      request_data: logEntry.request_data ? JSON.stringify(logEntry.request_data) : null,
      response_data: logEntry.response_data ? JSON.stringify(logEntry.response_data) : null,
      error_message: logEntry.error_message || null,
      error_stack: logEntry.error_stack || null,
      duration_ms: logEntry.duration_ms || null,
      endpoint: logEntry.endpoint || null,
      ip_address: logEntry.ip_address || null,
      user_agent: logEntry.user_agent || null,
      metadata: logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
      created_at: new Date().toISOString(),
    }));

    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from('sms_logs')
      .insert(logData)
      .select('id');

    if (error) {
      console.error('[SMS Logger] Toplu log kaydı oluşturulamadı:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error: any) {
    console.error('[SMS Logger] Toplu log kaydı oluşturma hatası:', error);
    return 0;
  }
}

