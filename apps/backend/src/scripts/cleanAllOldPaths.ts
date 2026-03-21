import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/admin/Documents/projects/school projects/career-dev-app/apps/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanOldPaths() {
    console.log('Fetching all learning paths...');
    const { data: paths, error } = await supabase.from('learning_paths').select('id, title, overview');
    
    if (error) {
        console.error('Error fetching paths:', error);
        return;
    }

    let deletedCount = 0;

    for (const path of paths) {
        // Any legacy path created before our 2D Graphic updates will lack the [ROADMAP] token in its overview schema.
        if (!path.overview || !path.overview.includes('[ROADMAP]')) {
            console.log(`Deleting legacy legacy or rogue path: ${path.title} (ID: ${path.id})`);
            const { error: delErr } = await supabase.from('learning_paths').delete().eq('id', path.id);
            if (delErr) {
                console.error(`Failed to delete ${path.id}:`, delErr);
            } else {
                deletedCount++;
            }
        }
    }

    console.log(`\nCleanup complete. Successfully removed ${deletedCount} old/ghost paths without 2D maps.`);
}

cleanOldPaths();
