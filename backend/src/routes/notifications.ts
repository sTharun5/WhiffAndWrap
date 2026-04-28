import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: any, res) => {
    try {
        const notifs = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(notifs);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: any, res) => {
    try {
        await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req: any, res) => {
    try {
        const { type } = req.query;
        const whereClause: any = { userId: req.user.id, read: false };
        if (type) {
            whereClause.type = type;
        }
        await prisma.notification.updateMany({ where: whereClause, data: { read: true } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/notifications
router.delete('/', authenticate, async (req: any, res) => {
    try {
        const { type } = req.query;
        const whereClause: any = { userId: req.user.id };
        if (type) {
            whereClause.type = type;
        }
        await prisma.notification.deleteMany({ where: whereClause });
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
