import axios from 'axios';
import { supabase } from '@/config/supabase';

// Use host machine IP for local development if needed, or your production URL
const BACKEND_URL = 'http://192.168.1.13:5050'; // TODO: Move to config

export class AIAssistantService {
    /**
     * Get consolidated data for a CV/Resume based on user context
     */
    static async getMagicFillData(userId: string) {
        try {
            // 1. Gather context from multiple sources
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
            const { data: assessments } = await supabase.from('career_assessments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
            const { data: scans } = await supabase.from('cv_scans').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
            const { data: conversations } = await supabase.from('conversations').select('summary_insights, summary_quotes').eq('user_id', userId).limit(5);

            const userData = {
                profile,
                latestAssessment: assessments?.[0],
                latestScan: scans?.[0],
                recentInsights: conversations?.flatMap(c => c.summary_insights || []),
                recentQuotes: conversations?.flatMap(c => c.summary_quotes || [])
            };

            // 2. Call Backend for consolidation
            const response = await axios.post(`${BACKEND_URL}/api/ai/resume-magic-fill`, { userData });
            return response.data;
        } catch (error) {
            console.error('Error in getMagicFillData:', error);
            throw error;
        }
    }

    /**
     * Refine text block (e.g., summary, experience bullets)
     */
    static async refineText(text: string, context: 'resume' | 'cv' = 'resume') {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/ai/refine-resume`, { text, context });
            return response.data.refined;
        } catch (error) {
            console.error('Error in refineText:', error);
            return text; // Fallback to original text
        }
    }
}
