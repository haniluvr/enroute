import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'PLACEHOLDER_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PLACEHOLDER_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
