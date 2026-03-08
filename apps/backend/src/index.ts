import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Default express setup
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Client (requires service role key for backend admin tasks)
const supabaseUrl = process.env.SUPABASE_URL || 'PLACEHOLDER_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PLACEHOLDER_KEY';
// const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Enroute AI Backend' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
