"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// GET /api/categories
router.get('/', async (_req, res) => {
    try {
        const categories = await prisma_1.prisma.category.findMany({ include: { _count: { select: { products: true } } } });
        res.json(categories);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
