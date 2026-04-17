const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApps() {
  const { data, error } = await supabase.from('job_applications').select('*').limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Job Applications Sample:", JSON.stringify(data, null, 2));
  }
}

checkApps();
