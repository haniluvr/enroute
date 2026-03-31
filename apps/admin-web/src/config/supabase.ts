import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmaddogdctwpxdpphnzr.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWRkb2dkY3R3cHhkcHBobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4MzI2MywiZXhwIjoyMDg4NTU5MjYzfQ.44TvFntGOI64m85YQje4ficRTrCiyyOwA9_cizK121I';

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
