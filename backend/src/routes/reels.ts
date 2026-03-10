import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/reels - Fetch all reels for homepage
router.get('/', async (_req, res) => {
    try {
        const reels = await prisma.reel.findMany({
            orderBy: { priority: 'desc' },
        });
        res.json(reels);
    } catch (err) {
        console.error('Error fetching reels:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
