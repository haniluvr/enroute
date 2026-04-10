import { Platform } from 'react-native';

// For local development, Android emulator needs 10.0.2.2, iOS uses localhost
// If you use a physical device, use your machine's local IP address
export const BACKEND_URL = 'http://192.168.3.9:5050';

export const AI_API = {
    CHAT: `${BACKEND_URL}/api/ai/chat`,
    ROADMAP: `${BACKEND_URL}/api/ai/roadmap`,
    PARSE_CV: `${BACKEND_URL}/api/ai/parse-cv`,
    STT: `${BACKEND_URL}/api/ai/stt`,
    TTS: `${BACKEND_URL}/api/ai/tts`,
    ANALYZE_ASSESSMENT: `${BACKEND_URL}/api/ai/analyze-assessment`,
    APPLY: `${BACKEND_URL}/api/jobs/apply`,
    SEARCH_JOBS: `${BACKEND_URL}/api/jobs/search`,
    SYNC_JOB: `${BACKEND_URL}/api/jobs/sync`,
    SUMMARIZE: `${BACKEND_URL}/api/ai/summarize`,
};
