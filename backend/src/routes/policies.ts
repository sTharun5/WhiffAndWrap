import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/policies - Get all policies (minimal data)
router.get('/', async (_req, res) => {
    try {
        const policies = await prisma.policy.findMany({
            select: { id: true, title: true, slug: true },
            orderBy: { title: 'asc' }
        });
        res.json(policies);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/policies/:slug - Get specific policy by slug
router.get('/:slug', async (req, res) => {
    try {
        const policy = await prisma.policy.findUnique({
            where: { slug: req.params.slug }
        });
        if (!policy) return res.status(404).json({ error: 'Policy not found' });
        res.json(policy);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
