"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// GET /api/products - list with search/filter
router.get('/', async (req, res) => {
    try {
        const { category, search, page = '1', limit = '12' } = req.query;
        const where = {};
        if (category)
            where.category = { name: { equals: category } };
        if (search)
            where.name = { contains: search };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                include: { category: true, reviews: { select: { rating: true } } },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.product.count({ where }),
        ]);
        const enriched = products.map(p => ({
            ...p,
            avgRating: p.reviews.length
                ? p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length
                : null,
            reviewCount: p.reviews.length,
        }));
        res.json({ products: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                reviews: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!product) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const avgRating = product.reviews.length
            ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length
            : null;
        res.json({ ...product, avgRating, reviewCount: product.reviews.length });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
