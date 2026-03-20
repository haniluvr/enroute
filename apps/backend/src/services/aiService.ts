import axios from 'axios';
import dotenv from 'dotenv';
import { externalDataService } from './externalDataService';

dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_BASE_URL = 'https://router.huggingface.co/hf-inference';

export const aiService = {
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
            const prompt = `Extract professional skills from the following resume text as a JSON list of strings:\n\n${text}`;
            
            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are a professional recruiting assistant. Output ONLY a valid JSON array of skills.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 300,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content?.match(/\[.*\]/s);
            return match ? JSON.parse(match[0]) : [];
        } catch (error: any) {
            console.error('CV Parse Error:', error?.response?.data || error.message);
            return [];
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
            Base Curriculum Topics: ${baseModules.join(', ')}
            
            Generate a 4-step professional roadmap to reach this goal. 
            Ensure each step is practical and actionable. 
            Return as a JSON object with keys: 
            - salary: "${stats.avgSalary}"
            - demand: "${stats.jobDemand}"
            - estimated_duration: overall time (e.g. 6-12 months)
            - roadmap: array of { title, description, platform (e.g. Coursera, Enroute AI), est_time }`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are an expert career path strategist. Output ONLY valid JSON.' },
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
     * Generate TTS audio via ElevenLabs
     */
    async generateTTS(text: string) {
        try {
            const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
            if (!ELEVEN_LABS_API_KEY) throw new Error('ElevenLabs API Key missing');

            // Custom voice from ElevenLabs library
            const VOICE_ID = 'OsxBZB11a95XBjzhyG89';
            
            console.log('Generating TTS via ElevenLabs...');
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
                {
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                },
                {
                    headers: {
                        'xi-api-key': ELEVEN_LABS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }
            );

            const audioBuffer = Buffer.from(response.data);
            const base64Audio = audioBuffer.toString('base64');
            console.log(`ElevenLabs TTS success, audio size: ${audioBuffer.length} bytes`);
            return `data:audio/mpeg;base64,${base64Audio}`;
        } catch (error: any) {
            let errorMsg = error.message;
            if (error.response?.data) {
                // If it's an ArrayBuffer, convert to string
                errorMsg = Buffer.isBuffer(error.response.data) || error.response.data instanceof ArrayBuffer
                    ? Buffer.from(error.response.data).toString()
                    : JSON.stringify(error.response.data);
            }
            console.error('ElevenLabs TTS Error:', errorMsg);
            throw new Error(`TTS failed: ${errorMsg}`);
        }
    }
};
