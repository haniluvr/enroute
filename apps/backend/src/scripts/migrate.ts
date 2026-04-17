import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL?.replace('?pgbouncer=true', '');

const client = new Client({
  connectionString: connectionString
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to Postgres');
    
    const sql = `
      ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS short_description TEXT;
      ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS type TEXT;
      ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS icon TEXT;
      ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS last_updated TEXT;
      ALTER TABLE public.learning_modules ADD COLUMN IF NOT EXISTS icon TEXT;
    `;
    
    await client.query(sql);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
