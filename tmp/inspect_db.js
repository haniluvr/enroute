const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmaddogdctwpxdpphnzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWRkb2dkY3R3cHhkcHBobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4MzI2MywiZXhwIjoyMDg4NTU5MjYzfQ.44TvFntGOI64m85YQje4ficRTrCiyyOwA9_cizK121I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- conversation_messages ---");
    const { data: convMsgs, error: e1 } = await supabase.from('conversation_messages').select('*').limit(1);
    console.log(convMsgs ? Object.keys(convMsgs[0] || {}) : e1);

    console.log("--- messages ---");
    const { data: msgs, error: e2 } = await supabase.from('messages').select('*').limit(1);
    console.log(msgs ? Object.keys(msgs[0] || {}) : e2);

    console.log("--- learning_modules ---");
    const { data: mods, error: e3 } = await supabase.from('learning_modules').select('*').limit(1);
    console.log(mods ? Object.keys(mods[0] || {}) : e3);

    console.log("--- learning_paths ---");
    const { data: paths, error: e4 } = await supabase.from('learning_paths').select('*').limit(1);
    console.log(paths ? Object.keys(paths[0] || {}) : e4);
    
    console.log("--- conversations ---");
    const { data: convs, error: e5 } = await supabase.from('conversations').select('*').limit(1);
    console.log(convs ? Object.keys(convs[0] || {}) : e5);
}

inspect();
