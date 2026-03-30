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
import { externalDataService } from './services/externalDataService';
import rateLimit from 'express-rate-limit';

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

// Rate Limiter for JSearch (Free tier protection)
const jobSearchLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // 10 requests per day per IP for testing
    message: { error: 'Daily job search limit reached. Please try again tomorrow!' }
});

app.use((req, res, next) => {
    console.log(`\n📢 [API] >>> ${req.method} ${req.url} at ${new Date().toLocaleTimeString()} <<<`);
    next();
});

// Redirect console to file for easier debugging
const logFile = fs.createWriteStream('backend.log', { flags: 'a' });
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
        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate roadmap' });
    }
});

/**
 * Speech-to-Text (Transcribe) Endpoint
 */
app.post('/api/ai/analyze-assessment', async (req, res) => {
    try {
        const { answers } = req.body;
        if (!answers) return res.status(400).json({ error: 'No answers provided' });
        
        console.log(`Analyzing assessment...`);
        const result = await aiService.analyzeAssessment(answers);
        res.json(result);
    } catch (error) {
        console.error('Assessment Analyze Error:', error);
        res.status(500).json({ error: 'Failed to analyze assessment' });
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

        const model = req.body.model as 'whisper' | 'moonshine' || 'whisper';
        console.log(`Received audio file: ${req.file.path}, requested model: ${model}`);
        
        const transcription = await sttService.transcribe(req.file.path, model);
        
        // Clean up: delete original file
        fs.unlinkSync(req.file.path);

        res.json({ transcription });
    } catch (error) {
        console.error('STT Endpoint Error:', error);
        // Clean up even on error
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

/**
 * Text-to-Speech Endpoint
 */
app.post('/api/ai/tts', async (req, res) => {
    try {
        const { text } = req.body;
        console.log(`TTS Request received for text: "${text.substring(0, 30)}..."`);
        const audioUri = await aiService.generateTTS(text);
        console.log('TTS URI generated successfully, sending to client');
        res.json({ audioUri });
    } catch (error) {
        console.error('TTS Endpoint Error:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

/**
 * CV Parsing Endpoint (Upgraded with AI Vision & PDF Support)
 */
app.post('/api/ai/parse-cv', async (req, res) => {
    try {
        const { text, fileUrl, fileType } = req.body;
        console.log(`[CV] Parsing request received. Type: ${fileType || 'text'}`);
        
        let skills: any = [];
        let suggestedSkills: string[] = [];

        if (fileUrl) {
            const firstUrl = Array.isArray(fileUrl) ? fileUrl[0] : fileUrl;
            const isPdf = fileType === 'application/pdf' || (typeof firstUrl === 'string' && firstUrl.toLowerCase().endsWith('.pdf'));
            
            console.log(`[CV] Processing fileUrl: ${Array.isArray(fileUrl) ? `Array(${fileUrl.length})` : fileUrl}, isPdf: ${isPdf}`);

            if (isPdf) {
                // 1. PDF Path: Extract text first, then analyze
                const urlToProcess = Array.isArray(fileUrl) ? fileUrl[0] : fileUrl;
                const extractedText = await aiService.extractTextFromPDF(urlToProcess);
                skills = await aiService.parseCV(extractedText);
            } else {
                // 2. Image Path: Use Qwen 2.5 VL directly (supports single or multiple)
                console.log(`[CV] Calling parseCVVision...`);
                const result = await aiService.parseCVVision(fileUrl);
                skills = result.skills;
                console.log(`[CV] Vision result:`, JSON.stringify(skills));
                // If the vision service already did suggestions, we take those
                if (result.suggestedSkills) suggestedSkills = result.suggestedSkills;
            }
        } else if (text) {
            // Legacy/Fallback: Parse text directly
            skills = await aiService.parseCV(text);
        }

        // 3. Generate dynamic suggestions only if we haven't already got them
        const flattenedSkills = Array.isArray(skills) ? skills : [...(skills.technical || []), ...(skills.soft || [])];
        if (!suggestedSkills || suggestedSkills.length === 0) {
            suggestedSkills = await aiService.suggestMissingSkills(flattenedSkills);
        }

        res.json({ 
            skills, 
            suggestedSkills 
        });
    } catch (error: any) {
        console.error('CV Parse Endpoint Error:', error);
        res.status(500).json({ error: 'Failed to parse CV', details: error.message });
    }
});

/**
 * Job Application / Forwarding Endpoint
 */
app.post('/api/jobs/apply', async (req, res) => {
    try {
        const { userId, jobId, cvUrl } = req.body;
        if (!userId || !jobId) return res.status(400).json({ error: 'Missing userId or jobId' });

        console.log(`[Job Application] Process for User: ${userId} to Job: ${jobId}`);

        // 1. Fetch Job details for forwarding
        const { data: job, error: jobErr } = await supabase
            .from('jobs')
            .select('role_title, company_name, contact_email')
            .eq('id', jobId)
            .single();

        if (jobErr || !job) throw new Error('Job not found');

        // 2. Update Application Status (Upsert)
        const { data: application, error: appErr } = await supabase
            .from('job_applications')
            .upsert({ 
                user_id: userId, 
                job_id: jobId, 
                status: 'applied',
                cv_url: cvUrl,
                applied_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,job_id' });

        if (appErr) {
            console.warn('[Job Application] Upsert error (likely missing unique constraint), trying insert:', appErr.message);
            // Fallback for missing unique constraint: just insert if not exists
            const { error: insertErr } = await supabase
                .from('job_applications')
                .insert({ 
                    user_id: userId, 
                    job_id: jobId, 
                    status: 'applied',
                    cv_url: cvUrl,
                    applied_at: new Date().toISOString()
                });
            if (insertErr && !insertErr.message.includes('duplicate key')) throw insertErr;
        }

        // 3. Forward CV to Company (Network Simulation)
        const recipient = job.contact_email || 'careers@enroute.dev';
        console.log(`\n📢 [EMAIL FORWARDED] 📢`);
        console.log(`TO: ${recipient}`);
        console.log(`SUBJECT: New Application: ${job.role_title} via Enroute`);
        console.log(`BODY: User ${userId} has applied for ${job.role_title}.`);
        console.log(`ATTACHMENT: ${cvUrl || 'No CV linked'}`);
        console.log(`-------------------------\n`);

        res.json({ success: true, message: `Application forwarded to ${recipient}`, status: 'applied' });
    } catch (error: any) {
        console.error('Apply Endpoint Error:', error);
        res.status(500).json({ error: 'Failed to process application', details: error.message });
    }
});

/**
 * Job Search External API Endpoint (Localized)
 */
app.get('/api/jobs/search', jobSearchLimiter, async (req, res) => {
    try {
        const { query, location } = req.query as { query: string, location?: string };
        if (!query) return res.status(400).json({ error: 'Search query is required' });
        
        console.log(`[Job Search] Handling request: query="${query}", location="${location || 'Global'}"`);
        const jobs = await externalDataService.searchJobs(query, location);
        res.json({ jobs });
    } catch (error: any) {
        console.error('Job Search Error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

/**
 * Sync External Job to Local Database
 */
app.post('/api/jobs/sync', async (req, res) => {
    try {
        const { job } = req.body;
        if (!job || !job.id) return res.status(400).json({ error: 'Missing job data' });

        console.log(`[Sync] Syncing external job: ${job.role_title} for ${job.company_name}`);

        // Upsert into local jobs table using external_id as unique key
        const { data: syncedJob, error } = await supabase
            .from('jobs')
            .upsert({
                role_title: job.role_title,
                company_name: job.company_name,
                location: job.location,
                description: job.description,
                required_skills: job.required_skills,
                salary_range: job.salary_range,
                company_logo: job.company_logo,
                is_active: true,
                external_id: job.id
            }, { onConflict: 'external_id' })
            .select()
            .single();

        if (error) {
            console.warn('[Sync] Upsert error (possibly missing unique constraint):', error.message);
            // Fallback: search by name/company if external_id fails
            const { data: existing } = await supabase
                .from('jobs')
                .select('id')
                .eq('role_title', job.role_title)
                .eq('company_name', job.company_name)
                .single();
            
            if (existing) return res.json({ id: existing.id });

            const { data: inserted, error: insertErr } = await supabase
                .from('jobs')
                .insert({
                    role_title: job.role_title,
                    company_name: job.company_name,
                    location: job.location,
                    description: job.description,
                    required_skills: job.required_skills,
                    salary_range: job.salary_range,
                    company_logo: job.company_logo,
                    external_id: job.id
                })
                .select()
                .single();
            
            if (insertErr) throw insertErr;
            return res.json({ id: inserted.id });
        }

        res.json({ id: syncedJob.id });
    } catch (error: any) {
        console.error('Job Sync Error:', error);
        res.status(500).json({ error: 'Failed to sync job', details: error.message });
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
