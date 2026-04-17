import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

async function updateSchema() {
    if (!connectionString) {
        console.error('DATABASE_URL is not defined in .env');
        return;
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Supabase DB');

        console.log('Updating jobs table schema...');
        await client.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS external_id TEXT;
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo TEXT;
        `);
        
        // Add unique constraint separately to avoid failure if already exists
        try {
            await client.query(`ALTER TABLE jobs ADD CONSTRAINT unique_external_id UNIQUE (external_id);`);
            console.log('Added unique constraint to external_id');
        } catch (e) {
            console.log('Unique constraint on external_id already exists or failed:', (e as any).message);
        }

        console.log('Schema update complete!');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await client.end();
    }
}

updateSchema();
