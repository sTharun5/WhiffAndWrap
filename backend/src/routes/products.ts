import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/products - list with search/filter
router.get('/', async (req, res) => {
    try {
        const { category, search, page = '1', limit = '12' } = req.query;
        const where: any = {};
        if (category) where.category = { name: { equals: category as string } };
        if (search) where.name = { contains: search as string };
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { category: true, reviews: { select: { rating: true } } },
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where }),
        ]);
        const enriched = products.map(p => ({
            ...p,
            avgRating: p.reviews.length
                ? p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length
                : null,
            reviewCount: p.reviews.length,
        }));
        res.json({ products: enriched, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                reviews: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!product) { res.status(404).json({ error: 'Not found' }); return; }
        const avgRating = product.reviews.length
            ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length
            : null;
        res.json({ ...product, avgRating, reviewCount: product.reviews.length });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
