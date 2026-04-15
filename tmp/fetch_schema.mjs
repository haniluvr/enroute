import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchSchema() {
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .filter('table_schema', 'eq', 'public')
    .in('table_name', ['learning_modules', 'learning_paths', 'recommendations', 'users', 'user_learning_paths', 'profiles']);

  if (tablesError) {
    console.error('Error fetching schema:', tablesError);
    return;
  }

  const schema = {};
  tables.forEach((row) => {
    if (!schema[row.table_name]) schema[row.table_name] = [];
    schema[row.table_name].push({ column: row.column_name, type: row.data_type });
  });

  console.log(JSON.stringify(schema, null, 2));
}

fetchSchema();
