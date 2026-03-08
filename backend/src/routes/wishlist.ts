import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

// GET /api/wishlist
router.get('/', authenticate, async (req: any, res) => {
    try {
        const items = await prisma.wishlist.findMany({
            where: { userId: req.user.id },
            include: { product: { include: { category: true, reviews: { select: { rating: true } } } } },
        });
        res.json(items);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/wishlist/:productId
router.post('/:productId', authenticate, async (req: any, res) => {
    try {
        const item = await prisma.wishlist.create({
            data: { userId: req.user.id, productId: req.params.productId },
            include: { product: { include: { category: true, reviews: { select: { rating: true } } } } },
        });
        res.status(201).json(item);
    } catch { res.status(409).json({ error: 'Already in wishlist' }); }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', authenticate, async (req: any, res) => {
    try {
        await prisma.wishlist.delete({
            where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
        });
        res.json({ success: true });
    } catch { res.status(404).json({ error: 'Not found' }); }
});

export default router;
