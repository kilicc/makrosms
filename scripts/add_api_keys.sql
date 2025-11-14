-- API Keys tablosu oluştur
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi API key'lerini görebilir
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Kullanıcılar kendi API key'lerini oluşturabilir
CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Kullanıcılar kendi API key'lerini güncelleyebilir
CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Kullanıcılar kendi API key'lerini silebilir
CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Admin kullanıcılar tüm API key'leri görebilir
CREATE POLICY "Admins can view all API keys"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'moderator', 'administrator')
    )
  );

COMMENT ON TABLE api_keys IS 'API anahtarları - Müşteriler için API erişimi';
COMMENT ON COLUMN api_keys.api_key IS 'API Key (User parametresi olarak kullanılacak)';
COMMENT ON COLUMN api_keys.api_secret IS 'API Secret (Pass parametresi olarak kullanılacak)';

