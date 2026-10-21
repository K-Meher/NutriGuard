import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) || (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : '');
const rawKey = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) || (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY : '');

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.trim().length > 0 &&
  !rawUrl.includes('your-project-id')
);

const supabaseUrl = isSupabaseConfigured 
  ? rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') 
  : 'https://placeholder.supabase.co';
const supabaseKey = isSupabaseConfigured ? rawKey.trim() : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
