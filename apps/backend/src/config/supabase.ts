import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// The backend MUST use the Service Role Key to bypass RLS for admin tasks (like CV parsing, DB inserts for users)
// Warning: NEVER expose the service role key to the frontend client applications.

const supabaseUrl = process.env.SUPABASE_URL || 'PLACEHOLDER_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PLACEHOLDER_SUPABASE_SERVICE_ROLE_KEY';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
