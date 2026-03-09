import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace these placeholders with actual Supabase project configs later
// We use a flexible connector so UI components can be built independent of a live DB
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "PLACEHOLDER_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
