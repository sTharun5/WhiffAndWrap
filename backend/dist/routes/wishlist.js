"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// GET /api/wishlist
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const items = await prisma_1.prisma.wishlist.findMany({
            where: { userId: req.user.id },
            include: { product: { include: { category: true, reviews: { select: { rating: true } } } } },
        });
        res.json(items);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// POST /api/wishlist/:productId
router.post('/:productId', auth_1.authenticate, async (req, res) => {
    try {
        const item = await prisma_1.prisma.wishlist.create({
            data: { userId: req.user.id, productId: req.params.productId },
        });
        res.status(201).json(item);
    }
    catch {
        res.status(409).json({ error: 'Already in wishlist' });
    }
});
// DELETE /api/wishlist/:productId
router.delete('/:productId', auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.wishlist.delete({
            where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
        });
        res.json({ success: true });
    }
    catch {
        res.status(404).json({ error: 'Not found' });
    }
});
exports.default = router;
