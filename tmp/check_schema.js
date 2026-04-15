const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmaddogdctwpxdpphnzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWRkb2dkY3R3cHhkcHBobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4MzI2MywiZXhwIjoyMDg4NTU5MjYzfQ.44TvFntGOI64m85YQje4ficRTrCiyyOwA9_cizK121I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: paths, error } = await supabase.from('learning_paths').select('*').limit(1);
    console.log("learning_paths keys:", paths && paths.length > 0 ? Object.keys(paths[0]) : "No data/Error", error);

    const { data: roadmaps, error: err2 } = await supabase.from('roadmaps').select('*').limit(1);
    console.log("roadmaps keys:", roadmaps && roadmaps.length > 0 ? Object.keys(roadmaps[0]) : "No data/Error", err2);

    const { data: cv, error: err3 } = await supabase.from('cv_scans').select('*').limit(1);
    console.log("cv_scans keys:", cv && cv.length > 0 ? Object.keys(cv[0]) : "No data/Error", err3);
}

inspect();
