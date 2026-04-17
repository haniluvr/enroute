import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/admin/Documents/projects/school projects/career-dev-app/apps/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log('Fetching frontend paths...');
    const { data, error } = await supabase.from('learning_paths').select('id, title, created_at').eq('title', 'frontend').order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error fetching paths:', error);
        return;
    }

    if (data && data.length > 1) {
        console.log(`Found ${data.length} frontend paths. Deleting oldest...`);
        // Keep the newest (last in array), delete the rest
        for (let i = 0; i < data.length - 1; i++) {
            console.log(`Deleting ID: ${data[i].id}`);
            await supabase.from('learning_paths').delete().eq('id', data[i].id);
        }
        console.log('Deleted old frontend paths.');
    } else {
        console.log('Only 1 or 0 frontend paths found. No action needed.');
    }
}

run();
