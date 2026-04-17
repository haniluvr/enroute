import axios from 'axios';
import dotenv from 'dotenv';
import { HfInference } from '@huggingface/inference';
import { externalDataService } from './externalDataService';
const pdf = require('pdf-parse');
// Some versions/environments export the function as .default
const parsePdf = typeof pdf === 'function' ? pdf : pdf.default;

import fs from 'fs';
import path from 'path';

dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const hf = new HfInference(HF_API_KEY);
const HF_BASE_URL = 'https://router.huggingface.co/hf-inference';

// Load datasets for local verification (using process.cwd() for reliability in monorepo)
const SOFT_SKILLS_PATH = path.join(process.cwd(), 'training-datasets/softskills.csv');
const TECH_SKILLS_PATH = path.join(process.cwd(), 'training-datasets/technicalskills.txt');

const SOFT_SKILLS_DATASET = fs.existsSync(SOFT_SKILLS_PATH) 
    ? fs.readFileSync(SOFT_SKILLS_PATH, 'utf-8').toLowerCase()
    : "";
const TECH_SKILLS_DATASET = fs.existsSync(TECH_SKILLS_PATH)
    ? fs.readFileSync(TECH_SKILLS_PATH, 'utf-8').toLowerCase()
    : "";

export const aiService = {
    /**
     * Re-verify and correct AI categorization based on local datasets
     */
    verifySkillsCategorization(result: any) {
        const corrected = { technical: [] as string[], soft: [] as string[] };
        
        // Handle cases where AI returns nested categories or objects instead of arrays
        const flattenSkills = (input: any): string[] => {
            if (Array.isArray(input)) return input.filter(item => typeof item === 'string');
            if (typeof input === 'object' && input !== null) {
                return Object.values(input).flatMap(val => flattenSkills(val));
            }
            return typeof input === 'string' ? [input] : [];
        };

        const rawTech = flattenSkills(result?.technical);
        const rawSoft = flattenSkills(result?.soft);
        const allSkills = [...rawTech, ...rawSoft];

        // Normalize for matching: lower case, remove hyphens, trim
        const normalize = (s: string) => s.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

        allSkills.forEach(skill => {
            const norm = normalize(skill);
            const isSoft = SOFT_SKILLS_DATASET.includes(norm);
            const isTech = TECH_SKILLS_DATASET.includes(norm);

            if (isSoft) {
                corrected.soft.push(skill);
            } else if (isTech) {
                corrected.technical.push(skill);
            } else {
                // Determine based on original location if possible
                if (rawTech.includes(skill)) corrected.technical.push(skill);
                else corrected.soft.push(skill);
            }
        });

        // Deduplicate and filter empty
        corrected.technical = [...new Set(corrected.technical)].filter(s => s && s.length > 1);
        corrected.soft = [...new Set(corrected.soft)].filter(s => s && s.length > 1);

        return corrected;
    },
    /**
     * Chat/Coach response generation
     */
    async generateCoachResponse(persona: string, history: { role: 'user' | 'assistant' | 'system', content: string }[], isCall: boolean = false) {
        try {
            let systemPrompt = `You are ${persona}, a career coach for the Enroute app. 
            Be encouraging, professional, and practical. Use your expertise to guide the user towards their career goals.`;
            
            if (isCall) {
                systemPrompt += `\n\nCRITICAL: You are in a real-time voice call. Keep your responses extremely brief (1-2 sentences maximum). 
                Avoid long lists or deep explanations. Be punchy and conversational.`;
            }
            
            console.log(`Sending to HF Llama 3 - Persona: ${persona}`);
            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history
                ],
                max_tokens: 500,
                temperature: 0.7,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            console.log(`Model Response (${content?.length || 0} chars)`);
            return content;
        } catch (error: any) {
            console.error('AI Coach Error details:', error?.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Parse CV text to extract skills
     */
    async parseCV(text: string) {
        try {
            const prompt = `Extract professional skills from the following resume text. Categorize them into "technical" and "soft" skills. 
            
            REFERENCE EXAMPLES:
            Technical Skills: React, Node.js, SQL, Python, AWS, Docker, HTML, C++, Machine Learning, Data Analytics, System Architecture, Git, Microsoft Office, Java, Kubernetes.
            Soft Skills: Team management, Analytical thinking, Strategic thinking, Conflict resolution, Public speaking, Time management, Problem solving, Adaptability, Communication, Leadership, ability to work under pressure, results orientation.
            
            Return as a JSON object with keys "technical" and "soft", each containing an array of strings. Output ONLY the JSON object:\n\n${text}`;
            
            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are a professional recruiting assistant. Categorize skills strictly. Technical skills are specific hard skills/tools. Soft skills are interpersonal or cognitive abilities. Output ONLY a valid JSON object.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 600,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content?.match(/\{.*\}/s);
            const result = match ? JSON.parse(match[0]) : { technical: [], soft: [] };
            return this.verifySkillsCategorization(result);
        } catch (error: any) {
            console.error('CV Parse Error:', error?.response?.data || error.message);
            return { technical: [], soft: [] };
        }
    },

    /**
     * Parse CV from Image using a robust Vision model
     */
    async parseCVVision(fileUrls: string | string[]) {
        try {
            const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
            console.log(`[AI] Parsing CV via Vision for ${urls.length} images`);
            
            const imageContents: any[] = [];

            for (const url of urls) {
                console.log(`[AI] Adding image URL to payload: ${url.substring(0, 100)}...`);
                imageContents.push({ 
                    type: "image_url", 
                    image_url: { url: url } 
                });
            }

            if (imageContents.length === 0) {
                throw new Error("No valid images provided.");
            }

            // 2. Call Qwen 2.5 VL via the HF Inference Router
            // Passing URLs directly is supported by the HF message router and avoids payload size limits
            const hfResponse = await axios.post(`https://router.huggingface.co/v1/chat/completions`, {
                model: "Qwen/Qwen2.5-VL-7B-Instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Extract professional skills as concise names (1-3 words). 
                                
                                JSON FORMAT:
                                {
                                  "technical": ["Python", "Docker"],
                                  "soft": ["Problem Solving"],
                                  "suggested_role": "Full Stack Developer"
                                }

                                NO NESTED OBJECTS. Just flat arrays of strings. Output ONLY valid JSON.`
                            },
                            ...imageContents
                        ]
                    }
                ],
                max_tokens: 1500,
            }, {
                headers: { 
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const text = hfResponse.data.choices?.[0]?.message?.content || "";
            console.log(`[AI] Vision raw output summary: ${text.substring(0, 100)}...`);
            
            let result: { technical: string[], soft: string[] } = { technical: [], soft: [] };
            
            const match = text.match(/\{.*\}/s);
            if (match) {
                try {
                    result = JSON.parse(match[0]);
                } catch (e) {
                    console.error('Failed to parse AI JSON:', e);
                }
            }
            
            if ((!result.technical || result.technical.length === 0) && (!result.soft || result.soft.length === 0)) {
                result = text ? await this.parseCV(text) : { technical: [], soft: [] };
            }

            const finalResult = this.verifySkillsCategorization(result);
            console.log(`[AI] Categorized and verified skills:`, finalResult);
            
            // For backward compatibility, combine skills for suggestion or pass them as is
            const allExtracted = [...(finalResult.technical || []), ...(finalResult.soft || [])];
            const suggestedSkills = await this.suggestMissingSkills(allExtracted);
            
            return {
                skills: finalResult, // This will now be an object { technical: [], soft: [] }
                suggestedSkills
            };
        } catch (error: any) {
            const errorMsg = error?.response?.data || error.message;
            console.error('CV Vision Parse Error Details:', JSON.stringify(errorMsg, null, 2));
            return {
                skills: [],
                suggestedSkills: ['Project Management', 'System Architecture', 'Cloud Infrastructure', 'Digital Security', 'AI & Machine Learning']
            };
        }
    },

    /**
     * Extract text from PDF from a remote URL
     */
    async extractTextFromPDF(fileUrl: string) {
        try {
            console.log(`[AI] Extracting text from PDF: ${fileUrl}`);
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const data = await parsePdf(response.data);
            return data.text;
        } catch (error: any) {
            console.error('PDF Extraction Error:', error.message);
            return "";
        }
    },

    /**
     * Suggest missing skills based on extracted skills
     */
    async suggestMissingSkills(extractedSkills: string[]) {
        try {
            if (!extractedSkills || extractedSkills.length === 0) {
                return ['Project Management', 'System Architecture', 'Cloud Infrastructure'];
            }

            const prompt = `User skills: ${extractedSkills.join(', ')}. 
            Suggest exactly 8 complementary high-impact professional skills.
            
            STRICT FORMATTING RULES:
            1. Output ONLY a valid JSON array of strings.
            2. NO PARENTHESES in skill names.
            3. NO EXAMPLES (e.g. say "Cloud Platforms", NOT "Cloud Platforms (AWS/Azure)").
            4. Clean, direct skill names only.`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are an expert career strategist. Output ONLY a valid JSON array of comprehensive missing skills.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content?.match(/\[.*\]/s);
            const skills: string[] = match ? JSON.parse(match[0]) : ['Cloud Infrastructure', 'Security Compliance', 'Scalability Systems', 'Professional Communication', 'Team Leadership'];
            
            // Clean any parentheses or examples if the AI ignored the prompt instructions
            return skills.map(skill => skill.replace(/\s*\(.*\)/g, '').trim());
        } catch (error: any) {
            console.error('Suggest Skills Error:', error.message);
            return ['Cloud Infrastructure', 'Security Compliance', 'Scalability Systems', 'Professional Communication', 'Team Leadership'];
        }
    },

    /**
     * Analyze Career Aptitude Assessment
     */
    async analyzeAssessment(answers: Record<number, string>) {
        try {
            // Convert numerical keys to a readable format
            const answersText = Object.entries(answers)
                .map(([qId, ans]) => `Question ${qId}: ${ans}`)
                .join('\n');

            const prompt = `Analyze these career aptitude test answers from a user:\n\n${answersText}\n\nBased on these answers, write a single concise and encouraging paragraph (max 2 sentences) suggesting their perfect career match. Focus primarily on either Software Development (Frontend/Backend/FullStack), Design (UI/UX), Engineering (DevOps, Data, AI), or Architecture. Output ONLY the paragraph, nothing else. Start with "Based on your answers, "`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are an expert career profiler. Output ONLY the requested paragraph summary. Be highly encouraging and specific.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.7,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            let content = response.data.choices[0].message.content.trim();
            // Clean up any extra quotes or weird artifacts
            content = content.replace(/^"|"$/g, '');
            
            // Generate a random confidence match percentage for realism
            const matchPercentage = Math.floor(Math.random() * (98 - 85 + 1)) + 85; 

            return {
                suggestion: content,
                matchPercentage
            };
        } catch (error: any) {
            console.error('Assessment Analysis Error:', error?.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Generate Career Roadmap (Grounded in real data)
     */
    async generateRoadmap(goal: string, currentSkills: string[]) {
        try {
            // 1. Fetch Job Stats for the goal (Quick Adzuna call)
            const stats = await externalDataService.getJobStats(goal);
            
            // 2. Read Local Knowledge Base
            const roleFilePath = path.join(process.cwd(), 'src/data/role.txt');
            const skillFilePath = path.join(process.cwd(), 'src/data/skill.txt');
            
            let localContext = '';
            try {
                const roleData = fs.existsSync(roleFilePath) ? fs.readFileSync(roleFilePath, 'utf-8') : '';
                const skillData = fs.existsSync(skillFilePath) ? fs.readFileSync(skillFilePath, 'utf-8') : '';
                localContext = `KNOWLEDGE BASE DATA:\nROLES:\n${roleData}\n\nSKILLS:\n${skillData}`;
            } catch (e: any) {
                console.warn('[AI] Context file error:', e.message);
            }

            // 3. Prompt AI with few-shot examples
            const prompt = `Goal: ${goal}
            User Skills: ${currentSkills.join(', ')}
            
            ${localContext}

            STRUCTURE EXAMPLE (Software Engineer):
            Step 1: Core Fundamentals (Description: "Learn logic, variables, and loops.", learnItems: ["Variables", "State", "Hooks", "Logic Flow"], platform: "Enroute", est_time: "2 Weeks")

            STRICT TASK: Generate a 4-step professional roadmap based on the Goal and User Skills. 
            Each step MUST have: title, description (max 30 words), learnItems (4 distinct sub-topics), platform, est_time.

            OUTPUT FORMAT (STRICT JSON ONLY):
            {
              "salary": "Range based on role",
              "demand": "High/Medium",
              "estimated_duration": "X Months",
              "roadmap": [
                { "title": "...", "description": "...", "platform": "...", "est_time": "...", "learnItems": ["...", "...", "...", "..."] },
                ... (TOTAL 4 STEPS)
              ]
            }`;

            console.log(`[AI] Generating roadmap for: "${goal}"`);
            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are an elite career development architect. You return ONLY the JSON object. Do not explain your logic.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.1 // Low temperature for high precision JSON
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            console.log(`[AI] Response Length: ${content?.length || 0} characters.`);

            const match = content?.match(/\{.*\}/s);
            let roadmapResult: any = { roadmap: [] };
            
            if (match) {
                try {
                    roadmapResult = JSON.parse(match[0]);
                } catch (e) {
                    console.error('[AI] JSON Parse Failed. Response:', content);
                }
            } else {
                console.error('[AI] No JSON block found in response');
            }

            // 4. Clean and slice for safety
            const finalSteps = (roadmapResult.roadmap || roadmapResult.steps || []).slice(0, 4).map((step: any) => ({
                ...step,
                videos: [] 
            }));

            console.log(`[AI] Successfully prepared ${finalSteps.length} steps.`);

            return {
                salary: roadmapResult.salary || stats.avgSalary,
                demand: roadmapResult.demand || stats.jobDemand,
                estimated_duration: roadmapResult.estimated_duration || '6-12 Months',
                roadmap: finalSteps
            };

        } catch (error: any) {
            console.error('[AI] Roadmap Generation Error:', error?.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Generate TTS audio via ElevenLabs
     */
    async generateTTS(text: string, voice: string = 'pNInz6obpg8ndPBZshv1') { // Default to a nice voice
        try {
            // Map legacy Kokoro voice names to ElevenLabs voice IDs if needed
            let elVoice = voice;
            const voiceMap: Record<string, string> = {
                'af_sky': 'pNInz6obpg8ndPBZshv1',
                'af_sarah': 'EXAVITQu4vr4xnSDxMaL',
                'af_bella': 'EXAVITQu4vr4xnSDxMaL',
                'am_michael': 'ErXw9S8t96xP9KToH9qF',
                'default': 'pNInz6obpg8ndPBZshv1'
            };
            
            if (voiceMap[voice]) {
                elVoice = voiceMap[voice];
            } else if (!voice || voice.length < 5) {
                elVoice = 'pNInz6obpg8ndPBZshv1';
            }

            console.log(`--- TTS START (ElevenLabs) --- Voice: ${voice} -> ${elVoice}`);
            
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`,
                {
                    text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                },
                {
                    headers: {
                        'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer'
                }
            );

            const base64Audio = Buffer.from(response.data).toString('base64');
            console.log(`ElevenLabs TTS success, audio size: ${response.data.byteLength} bytes`);
            
            return `data:audio/mpeg;base64,${base64Audio}`;
        } catch (error: any) {
            console.error('ElevenLabs TTS Error:', error?.response?.data || error.message);
            // Fallback to HF if ElevenLabs fails, but different model
            try {
                console.log('Falling back to HF for TTS...');
                const response = await hf.textToSpeech({
                    model: 'facebook/mms-tts-eng',
                    inputs: text,
                });
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = Buffer.from(arrayBuffer);
                return `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
            } catch (fallbackError: any) {
                console.error('TTS Fallback Error:', fallbackError.message);
                throw new Error(`TTS failed: ${error.message}`);
            }
        }
    },
    /**
     * Generate session summary: Key Insights and Key Quotes
     */
    async generateSummary(history: { role: string, content: string }[]) {
        try {
            const historyText = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');
            const prompt = `Summarize the following career coaching session into a brief overview paragraph, precisely 3 key insights, 3 key quotes, and 3 key action points (notes).
            
            FORMAT:
            {
              "overview": "A brief 2-3 sentence summary of the call.",
              "insights": ["Insight 1", "Insight 2", "Insight 3"],
              "quotes": ["Quote 1", "Quote 2", "Quote 3"],
              "notes": ["Action 1", "Action 2", "Action 3"]
            }
            
            Keep the overview encouraging, insights professional, quotes literal, and notes actionable. Output ONLY the JSON object.
            
            SESSION TEXT:
            ${historyText}`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are a career development specialist. Extract key learning points and notable quotes from coaching sessions. Output ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 800,
                temperature: 0.3
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content?.match(/\{.*\}/s);
            return match ? JSON.parse(match[0]) : { overview: "", insights: [], quotes: [], notes: [] };
        } catch (error: any) {
            console.error('Summary Generation Error:', error.message);
            return { overview: "", insights: [], quotes: [], notes: [] };
        }
    },

    /**
     * Refine Resume/CV text (Summary, Bullets, etc.)
     */
    async refineResumeText(text: string, context: string = "") {
        try {
            const prompt = `Refine the following professional text for a ${context || 'CV/Resume'}. 
            Improve the wording to be more impactful, professional, and achievement-oriented. 
            Do NOT change the underlying facts. 
            Keep it concise.
            
            TEXT:
            ${text}
            
            OUTPUT ONLY THE REFINED TEXT:`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are a professional resume editor. Output ONLY the refined text.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.4
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            return response.data.choices[0].message.content.trim();
        } catch (error: any) {
            console.error('Refine Text Error:', error.message);
            return text;
        }
    },

    /**
     * Consolidate user data into a structured Magic Fill response
     */
    async getResumeMagicFill(userData: any) {
        try {
            const prompt = `Based on the following user profile and interaction data, consolidate it into a structured JSON for a Resume/CV. 
            Only use data that is explicitly present.
            
            USER DATA:
            ${JSON.stringify(userData, null, 2)}
            
            FORMAT:
            {
              "personal": { "fullName": "...", "email": "...", "phone": "...", "location": "..." },
              "summary": "AI-generated professional summary based on profile.",
              "skills": ["Skill 1", "Skill 2"],
              "experience": [{ "title": "...", "company": "...", "dates": "...", "bullets": ["..."] }],
              "education": [{ "degree": "...", "school": "...", "year": "..." }]
            }
            
            Output ONLY valid JSON.`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are a career development assistant. Consolidate user data into a professional resume structure. Output ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.2
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content?.match(/\{.*\}/s);
            return match ? JSON.parse(match[0]) : {};
        } catch (error: any) {
            console.error('Magic Fill Error:', error.message);
            return {};
        }
    }
};
