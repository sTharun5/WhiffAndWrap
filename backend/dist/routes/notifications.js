"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// GET /api/notifications
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const notifs = await prisma_1.prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(notifs);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// PATCH /api/notifications/read-all
router.patch('/read-all', auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
