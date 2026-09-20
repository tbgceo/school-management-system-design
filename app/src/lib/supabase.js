import { createClient } from '@supabase/supabase-js';

/**
 * The one Supabase client.
 *
 * Both values come from .env, which is git-ignored. Vite inlines VITE_* into the
 * bundle, so the anon key ships to the browser — that is what it is for, and it
 * is safe only because row level security is on and the anon role reads nothing.
 * `npm run check:supabase` asserts exactly that.
 *
 * The service_role key must never appear here. It bypasses RLS entirely.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured
  ? createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  })
  : null;

/** Turns a PostgREST error into something a person can act on. */
export function describeError(error) {
  if (!error) return null;
  if (error.code === '42501') return 'บทบาทของคุณไม่มีสิทธิ์ทำรายการนี้';
  if (error.code === '23514' && error.message.includes('R9')) return error.message;
  if (error.message?.includes('Failed to fetch')) return 'ต่อฐานข้อมูลไม่ได้ · ตรวจ VITE_SUPABASE_URL ใน .env';
  return error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}
