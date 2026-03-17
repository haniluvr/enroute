import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

import { aiService } from './services/aiService';
import { sttService } from './services/sttService';

// Configure multer for audio uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads/')) {
    fs.mkdirSync('uploads/');
}

// Default express setup
const app = express();
app.use(cors());
app.use(express.json());

// Redirect console to file for easier debugging
const logFile = fs.createWriteStream('debug.log', { flags: 'a' });
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => {
    logFile.write(`[LOG ${new Date().toISOString()}] ${args.join(' ')}\n`);
    originalLog(...args);
};
console.error = (...args) => {
    logFile.write(`[ERR ${new Date().toISOString()}] ${args.join(' ')}\n`);
    originalError(...args);
};

console.log('Backend starting up...');
const supabaseUrl = process.env.SUPABASE_URL || 'PLACEHOLDER_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PLACEHOLDER_KEY';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.get('/api/health', async (req, res) => {
    let hfStatus = 'unknown';
    try {
        const testResp = await axios.post('https://router.huggingface.co/v1/chat/completions', 
            { 
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [{ role: "user", content: "hi" }],
                max_tokens: 10
            }, 
            { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` }, timeout: 5000 }
        );
        if (testResp.data) hfStatus = 'ok';
    } catch (e: any) {
        hfStatus = `error: ${e.message}`;
    }
    res.json({ status: 'healthy', service: 'Enroute AI Backend', huggingface: hfStatus });
});

/**
 * Chat/Coach Endpoint
 */
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { persona, history } = req.body;
        console.log(`Chat request for persona: ${persona}, history length: ${history?.length}`);
        const response = await aiService.generateCoachResponse(persona, history);
        console.log('Chat response generated successfully');
        res.json({ response });
    } catch (error: any) {
        console.error('Chat endpoint error:', error.message);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

/**
 * Roadmap Generation Endpoint
 */
app.post('/api/ai/roadmap', async (req, res) => {
    try {
        const { goal, currentSkills } = req.body;
        const roadmap = await aiService.generateRoadmap(goal, currentSkills || []);
        res.json({ roadmap });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate roadmap' });
    }
});

/**
 * Speech-to-Text (Transcribe) Endpoint
 */
app.post('/api/ai/stt', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        console.log('Received audio file:', req.file.path);
        const transcription = await sttService.transcribe(req.file.path);
        
        // Clean up: delete original file
        fs.unlinkSync(req.file.path);

        res.json({ transcription });
    } catch (error) {
        console.error('STT Endpoint Error:', error);
        // Clean up even on error
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

/**
 * CV Parsing Endpoint
 */
app.post('/api/ai/parse-cv', async (req, res) => {
    try {
        const { text } = req.body;
        const skills = await aiService.parseCV(text);
        res.json({ skills });
    } catch (error) {
        res.status(500).json({ error: 'Failed to parse CV' });
    }
});

const PORT = process.env.PORT || 5050;

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Global Error:', err);
    res.status(500).json({ 
        error: err.message || 'Internal Server Error',
        details: err.code || undefined
    });
});

// 404 Handler
app.use((req, res) => {
    console.log(`404: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Endpoint not found', path: req.url });
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
