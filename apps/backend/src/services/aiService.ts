import axios from 'axios';
import dotenv from 'dotenv';

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
     * Generate Career Roadmap
     */
    async generateRoadmap(goal: string, currentSkills: string[]) {
        try {
            const prompt = `User goal: ${goal}. Current skills: ${currentSkills.join(', ')}. 
            Generate a 4-step professional roadmap to reach this goal. 
            Output as a JSON array of objects with keys: title, description, platform (e.g. Coursera, Enroute AI).`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are an expert career path strategist. Output ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 800,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content?.match(/\[.*\]/s);
            return match ? JSON.parse(match[0]) : [];
        } catch (error: any) {
            console.error('Roadmap Error:', error?.response?.data || error.message);
            throw error;
        }
    }
};
