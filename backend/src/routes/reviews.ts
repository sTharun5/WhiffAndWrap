import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

// POST /api/reviews/:productId
router.post('/:productId', authenticate, async (req: any, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'Rating must be 1-5' }); return;
        }

        // Prevent duplicate reviews
        const existing = await prisma.review.findFirst({
            where: { userId: req.user.id, productId: req.params.productId }
        });
        if (existing) {
            res.status(409).json({ error: 'You have already reviewed this product' }); return;
        }

        const review = await prisma.review.create({
            data: { userId: req.user.id, productId: req.params.productId, rating: parseInt(rating), comment },
            include: { user: { select: { name: true, image: true } } },
        });
        res.status(201).json(review);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { productId: req.params.productId },
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(reviews);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
