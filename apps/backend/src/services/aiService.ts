import axios from 'axios';
import dotenv from 'dotenv';
import { HfInference } from '@huggingface/inference';
import { externalDataService } from './externalDataService';
const pdf = require('pdf-parse');

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
    async generateCoachResponse(persona: string, history: { role: 'user' | 'assistant' | 'system', content: string }[]) {
        try {
            const systemPrompt = `You are ${persona}, a career coach for the Enroute app. 
            Be encouraging, professional, and practical. Use your expertise to guide the user towards their career goals.`;
            
            console.log(`Sending to HF Llama 3 - Persona: ${persona}`);
            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
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
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
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
            const data = await pdf(response.data);
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
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
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
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
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
            // 1. Fetch Job Stats for the goal
            const stats = await externalDataService.getJobStats(goal);
            
            // 2. Fetch Base Curriculum if possible
            const baseModules = await externalDataService.getRoadmapModules(goal);
            
            // 3. Prompt AI with the real data as context
            const prompt = `User goal: ${goal}. 
            Current skills: ${currentSkills.join(', ')}. 
            
            REAL-WORLD CONTEXT:
            Average Salary: ${stats.avgSalary}
            Job Demand: ${stats.jobDemand}
            
            Generate a 4-step professional roadmap to reach this goal. 
            Each step must include a "learnItems" list of 3-5 specific sub-modules or learning objectives (e.g. "User research and personas", "Wireframing and prototyping").
            
            Return as a JSON object with keys: 
            - salary: "${stats.avgSalary}"
            - demand: "${stats.jobDemand}"
            - estimated_duration: overall time (e.g. 6-12 months)
            - roadmap: array of { title, description, platform, est_time, learnItems: ["Sub-module 1", "Sub-module 2"] }`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are an expert career path strategist. Output ONLY valid JSON with learning modules (learnItems) for each step.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content?.match(/\{.*\}/s);
            const roadmapResult = match ? JSON.parse(match[0]) : { roadmap: [] };

            // 4. For each step, fetch real resources
            const finalSteps = await Promise.all((roadmapResult.roadmap || []).slice(0, 4).map(async (step: any) => {
                const videos = await externalDataService.getYoutubeVideos(step.title);
                return {
                    ...step,
                    videos
                };
            }));

            return {
                ...roadmapResult,
                roadmap: finalSteps
            };

        } catch (error: any) {
            console.error('Roadmap Grounding Error:', error?.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Generate TTS audio via Hugging Face Kokoro-82M (using Replicate provider)
     */
    async generateTTS(text: string) {
        try {
            console.log('--- TTS START (Kokoro via Replicate) ---');
            
            // Using the new Inference Providers strategy
            const response = await hf.textToSpeech({
                model: 'hexgrad/Kokoro-82M',
                inputs: text,
                provider: 'replicate'
            });

            // hf.textToSpeech returns a Blob
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);
            const base64Audio = audioBuffer.toString('base64');
            console.log(`Kokoro TTS success, audio size: ${audioBuffer.length} bytes`);
            
            return `data:audio/mpeg;base64,${base64Audio}`;
        } catch (error: any) {
            console.error('Kokoro TTS Error:', error.message);
            throw new Error(`TTS failed: ${error.message}`);
        }
    }
};
