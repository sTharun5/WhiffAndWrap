"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// POST /api/reviews/:productId
router.post('/:productId', auth_1.authenticate, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'Rating must be 1-5' });
            return;
        }
        const review = await prisma_1.prisma.review.create({
            data: { userId: req.user.id, productId: req.params.productId, rating: parseInt(rating), comment },
            include: { user: { select: { name: true, image: true } } },
        });
        res.status(201).json(review);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await prisma_1.prisma.review.findMany({
            where: { productId: req.params.productId },
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(reviews);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
