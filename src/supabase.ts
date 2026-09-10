import { createClient } from '@supabase/supabase-js';

// Centralized Supabase client for Admin Authentication ONLY.
// Firebase Firestore remains the CRM database for all live data.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://kmrfbrfgewllahtkfmuu.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  'sb_publishable_BVUD831KTksMA00U7UHTvQ_Hd_Xgozv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const AUTHORIZED_ADMIN_EMAIL = 'akrp1432@gmail.com';

/**
 * Checks whether an email matches the authorized Admin email.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}
