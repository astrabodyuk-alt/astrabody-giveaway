import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not set in .env file!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Participant {
  id: string;
  ticket_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tier: 'bronze' | 'silver' | 'vip' | null;
  entries: number;
  google_review: boolean;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
}
