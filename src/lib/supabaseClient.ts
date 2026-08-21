import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'academy-auth',
  },
});

export type ProfileStatus = 'pending' | 'approved' | 'rejected';

export type Profile = {
  id: string;
  full_name: string | null;
  role: 'admin' | 'teacher';
  phone: string | null;
  status: ProfileStatus;
  created_at: string;
};