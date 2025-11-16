-- ============================================
-- MakroSMS - Complete Database Schema
-- Generated from Prisma Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  credit INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- CONTACT GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#1976d2',
  icon VARCHAR(50) DEFAULT 'group',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_contact_groups_user_id ON contact_groups(user_id);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  group_id UUID,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  last_contacted TIMESTAMPTZ(6),
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON UPDATE NO ACTION,
  UNIQUE(user_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_contacts_group_id ON contacts(group_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- ============================================
-- SMS MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  contact_id UUID,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent',
  cost DECIMAL(10, 2) DEFAULT 0,
  service_name VARCHAR(50),
  service_code VARCHAR(20),
  service_url TEXT,
  cep_sms_message_id VARCHAR(100),
  network VARCHAR(50),
  sent_at TIMESTAMPTZ(6) DEFAULT NOW(),
  delivered_at TIMESTAMPTZ(6),
  failed_at TIMESTAMPTZ(6),
  refund_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_phone ON sms_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_sent_at ON sms_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);

-- ============================================
-- SMS TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'Genel',
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_usage_count ON sms_templates(usage_count);
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);

-- ============================================
-- REFUNDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  sms_id UUID,
  original_cost DECIMAL(10, 2) NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  hours_waited DECIMAL(5, 1),
  remaining_hours DECIMAL(5, 1),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  processed_at TIMESTAMPTZ(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY (sms_id) REFERENCES sms_messages(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  completed_at TIMESTAMPTZ(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- ============================================
-- PAYMENT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  payment_method VARCHAR(50),
  credits INTEGER DEFAULT 0 NOT NULL,
  bonus INTEGER DEFAULT 0,
  description VARCHAR(500),
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ(6),
  rejected_at TIMESTAMPTZ(6),
  rejection_reason VARCHAR(500),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at);

-- ============================================
-- PAYMENT PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  credits INTEGER DEFAULT 0 NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  bonus INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_packages_is_active ON payment_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_packages_display_order ON payment_packages(display_order);

-- ============================================
-- CRYPTO CURRENCIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crypto_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  decimals INTEGER DEFAULT 8 NOT NULL,
  min_amount DECIMAL(20, 8) NOT NULL,
  network_fee DECIMAL(20, 8) NOT NULL,
  confirmations INTEGER DEFAULT 3 NOT NULL,
  wallet_address VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crypto_currencies_is_active ON crypto_currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_crypto_currencies_display_order ON crypto_currencies(display_order);

-- ============================================
-- SHORT LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  original_url TEXT NOT NULL,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255),
  description TEXT,
  click_count INTEGER DEFAULT 0,
  unique_click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_short_links_user_id ON short_links(user_id);
CREATE INDEX IF NOT EXISTS idx_short_links_short_code ON short_links(short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_is_active ON short_links(is_active);

-- ============================================
-- SHORT LINK CLICKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS short_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referer TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  clicked_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (short_link_id) REFERENCES short_links(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_short_link_clicks_short_link_id ON short_link_clicks(short_link_id);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_clicked_at ON short_link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_ip_address ON short_link_clicks(ip_address);

-- ============================================
-- API KEYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default payment packages
INSERT INTO payment_packages (package_id, name, credits, price, currency, bonus, is_active, display_order)
VALUES 
  ('starter', 'Başlangıç Paketi', 1000, 1500.00, 'TRY', 100, true, 1),
  ('pro', 'Pro Paketi', 5000, 7000.00, 'TRY', 500, true, 2),
  ('premium', 'Premium Paketi', 10000, 13000.00, 'TRY', 1500, true, 3)
ON CONFLICT (package_id) DO NOTHING;

-- Insert default crypto currencies
INSERT INTO crypto_currencies (symbol, name, decimals, min_amount, network_fee, confirmations, wallet_address, is_active, display_order)
VALUES 
  ('BTC', 'Bitcoin', 8, 0.0001, 0.0001, 3, NULL, true, 1),
  ('ETH', 'Ethereum', 18, 0.001, 0.005, 12, NULL, true, 2),
  ('USDT', 'Tether', 6, 1.0, 1.0, 3, NULL, true, 3),
  ('USDC', 'USD Coin', 6, 1.0, 1.0, 3, NULL, true, 4),
  ('TRX', 'TRON', 6, 10.0, 1.0, 20, NULL, true, 5)
ON CONFLICT (symbol) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Note: RLS policies should be set up in Supabase Dashboard
-- or via Supabase SQL Editor after tables are created

-- ============================================
-- COMPLETED
-- ============================================

