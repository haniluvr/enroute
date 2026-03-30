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

        // 1. Create job_applications table
        console.log('Creating job_applications table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                job_id UUID NOT NULL,
                status TEXT DEFAULT 'interested',
                applied_at TIMESTAMPTZ,
                cv_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Table job_applications created or already exists.');

        // 2. Add contact_email to jobs table if not exists
        console.log('Checking for contact_email in jobs table...');
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='jobs' AND column_name='contact_email';
        `);

        if (res.rowCount === 0) {
            console.log('Adding contact_email column to jobs...');
            await client.query(`
                ALTER TABLE jobs ADD COLUMN contact_email TEXT DEFAULT 'careers@enroute.dev';
            `);
            console.log('Column contact_email added.');
        } else {
            console.log('Column contact_email already exists.');
        }

        console.log('Schema update complete!');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await client.end();
    }
}

updateSchema();
