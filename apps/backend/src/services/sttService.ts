import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_BASE_URL = 'https://router.huggingface.co/hf-inference';

export const sttService = {
    /**
     * Transcribe audio file to text using Whisper
     */
    async transcribe(filePath: string) {
        try {
            console.log('--- STT START ---');
            const audioData = fs.readFileSync(filePath);
            
            console.log('Calling Hugging Face via Axios (Binary)...');
            let response: any;
            let retries = 3;
            
            while (retries > 0) {
                try {
                    response = await axios.post('https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3', audioData, {
                        headers: {
                            'Authorization': `Bearer ${HF_API_KEY}`,
                            'Content-Type': 'audio/mpeg',
                            'Accept': 'application/json',
                        },
                        timeout: 60000,
                    });
                    break; // Success!
                } catch (error: any) {
                    if (error.response?.data?.error?.includes('loading') && retries > 1) {
                        const waitTime = error.response.data.estimated_time || 10;
                        console.log(`Model loading, waiting ${waitTime}s...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                        retries--;
                        continue;
                    }
                    throw error;
                }
            }

            console.log('HF Response received');
            const result = response.data.text || response.data; // Flexible handling
            console.log('Transcription result:', result);
            return typeof result === 'string' ? result : result.text;
        } catch (error: any) {
            if (error.response) {
                console.error('HF API Error:', error.response.status, JSON.stringify(error.response.data));
            } else {
                console.error('STT Service Error:', error.message);
            }
            throw error;
        }
    }
};
