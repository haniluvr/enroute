const { Client } = require('pg');
const connectionString = "postgresql://postgres.rmaddogdctwpxdpphnzr:Toj4q5fPnGlQrrHI@aws-1-ap-southeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true";

async function setup() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        console.log("Creating resumes table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.resumes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                type TEXT NOT NULL CHECK (type IN ('resume', 'cv')),
                name TEXT NOT NULL DEFAULT 'Untitled',
                content JSONB NOT NULL DEFAULT '{}'::jsonb,
                template_id TEXT DEFAULT 'classic',
                is_favorite BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

            -- Drop if exists to avoid errors on re-run
            DROP POLICY IF EXISTS "Users can manage their own resumes" ON public.resumes;
            CREATE POLICY "Users can manage their own resumes" ON public.resumes
                FOR ALL USING (auth.uid() = user_id);
        `);
        console.log("Done!");
    } catch (err) {
        console.error("Error setting up table:", err);
    } finally {
        await client.end();
    }
}
setup();
