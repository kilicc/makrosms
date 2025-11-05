import { createClient } from '@supabase/supabase-js';

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ve Anon Key environment variables\'da tanımlı olmalıdır.');
}

// Client-side için Supabase client (anon key ile)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side için Supabase client (service key ile - admin yetkileri)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Type definitions
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;

