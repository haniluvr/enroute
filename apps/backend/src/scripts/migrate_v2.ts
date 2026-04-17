import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// Direct connection string to Supabase PostgreSQL Database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log('--- ENROUTE DATABASE MIGRATION V2 STARTING ---');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('1. Adding full_roadmap_data column to learning_paths...');
        await client.query(`
            ALTER TABLE public.learning_paths
            ADD COLUMN IF NOT EXISTS full_roadmap_data JSONB;
        `);

        await client.query('COMMIT');
        console.log('--- MIGRATION V2 COMPLETE ---');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration V2 failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(console.error);
