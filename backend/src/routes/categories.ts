import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/categories
router.get('/', async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } } });
        res.json(categories);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
