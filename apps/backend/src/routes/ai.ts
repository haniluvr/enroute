import { Router } from 'express';

const router = Router();

// ==========================================
// AI / LLM Integration Routes (Mocked setup)
// ==========================================

/**
 * Handle CV/Resume parsing.
 * The mobile app (scan-cv.tsx) will send an image or PDF.
 * This should connect to Google Gemini Vision or a Document AI to extract skills.
 */
router.post('/cv/parse', async (req, res) => {
    try {
        // TODO: Plumb in Gemini API here
        // const file = req.body.file;
        console.log("Received CV parsing request");
        
        // Mock response to match what the mobile app expects
        res.json({
            status: "success",
            data: {
                foundSkills: ["Javascript dev", "API Integration", "React framework", "UI/UX Design"],
                missingSkills: ["Version control", "SEO", "Technical writing", "Git & Github"]
            }
        });
    } catch (error) {
        console.error("CV Parsing Error:", error);
        res.status(500).json({ error: "Failed to parse CV" });
    }
});

/**
 * Handle Dahlia AI Chat interactions.
 * The mobile app (dahlia.tsx) will send a query string.
 * This should maintain context and query an LLM (e.g. Gemini).
 */
router.post('/chat/dahlia', async (req, res) => {
    try {
        const { message, history } = req.body;
        console.log("Received Dahlia chat message:", message);

        // TODO: Plumb in Gemini Chat API here

        res.json({
            status: "success",
            response: "Hi! I am Dahlia, your AI career coach. My LLM brain is currently being wired up in the backend."
        });
    } catch (error) {
        console.error("Dahlia Chat Error:", error);
        res.status(500).json({ error: "Failed to generate AI response" });
    }
});

export default router;
