import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read Supabase credentials strictly from environment variables without hardcoding
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.trim() !== '' &&
  supabaseKey.trim() !== '' &&
  supabaseUrl.startsWith('http')
);

// Initialize Supabase client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function getSupabase(): SupabaseClient | null {
  return supabase;
}
