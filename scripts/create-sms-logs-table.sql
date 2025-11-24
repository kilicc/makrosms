-- SMS Logs tablosunu oluştur
-- Bu script Supabase'de çalıştırılmalı

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sms_message_id UUID,
  user_id UUID,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT,
  message_preview VARCHAR(100),
  log_type VARCHAR(50) NOT NULL,
  log_level VARCHAR(20) NOT NULL,
  status VARCHAR(20),
  cep_sms_message_id VARCHAR(100),
  credit_amount DECIMAL(10, 2),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  error_stack TEXT,
  duration_ms INTEGER,
  endpoint VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (sms_message_id) REFERENCES sms_messages(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_sms_message_id ON sms_logs(sms_message_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_number ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_log_type ON sms_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_log_level ON sms_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_cep_sms_message_id ON sms_logs(cep_sms_message_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);

