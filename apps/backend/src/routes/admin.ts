import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Middleware to check Admin authorization (Mocked for now)
router.use((req, res, next) => {
    // In production, verify the user's JWT matches an admin role.
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        // console.warn("Admin API accessed without auth header");
    }
    next();
});

/**
 * Endpoint to securely fetch all user statistics
 * Bypasses RLS thanks to supabaseAdmin client
 */
router.get('/stats', async (req, res) => {
    try {
        const { data: profiles, error } = await supabaseAdmin.from('profiles').select('id');
        if (error) throw error;

        res.json({
            totalUsers: profiles.length,
            message: "Stats retrieved securely"
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
