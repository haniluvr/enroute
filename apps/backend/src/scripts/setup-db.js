const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from apps/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runSetup() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("No DATABASE_URL found in .env");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
    });

    try {
        console.log("Connecting to Supabase...");
        await client.connect();

        // 1. Enable pgvector
        console.log("Enabling pgvector extension...");
        await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

        // 2. Create conversations table
        console.log("Creating public.conversations...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.conversations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        persona_id TEXT NOT NULL,
        call_mode TEXT NOT NULL, 
        duration_seconds INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        // 3. Create messages table with vector embedding column
        console.log("Creating public.messages...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
        content TEXT NOT NULL,
        embedding vector(1536), -- Vector embeddings column for AI semantic search
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        // 4. Create insights table
        console.log("Creating public.insights...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.insights (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('summary', 'quote', 'action')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        // 5. Create notes table
        console.log("Creating public.notes...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.notes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        title TEXT,
        content TEXT,
        time_marker TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        console.log("✅ Schema setup complete! pgvector enabled.");
    } catch (err) {
        console.error("❌ Error setting up database:", err);
    } finally {
        await client.end();
    }
}

runSetup();
