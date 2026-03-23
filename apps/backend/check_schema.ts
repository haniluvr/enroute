import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function checkSchema() {
    const { data, error } = await supabase.from('roadmap_steps').select('*').limit(1);
    if (error) {
        console.error('Schema Error:', error);
    } else {
        console.log('Columns in roadmap_steps:', Object.keys(data[0] || {}));
    }
}

checkSchema();
