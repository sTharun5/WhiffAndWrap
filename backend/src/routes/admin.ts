import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../prisma';
import { sendOrderAcceptedUser, sendOrderStatusUpdateUser, sendOrderRejectedUser } from '../services/email';

const router = Router();
router.use(authenticate, requireAdmin);

// --- Products CRUD ---
router.get('/products', async (_req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { category: true, _count: { select: { orderItems: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(products);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/products', async (req, res) => {
    try {
        const { name, description, price, images, materials, personalizationOptions, tags, categoryId } = req.body;
        const product = await prisma.product.create({
            data: { name, description, price: parseFloat(price), images: images || [], materials, personalizationOptions, tags, categoryId: categoryId || null },
        });
        res.status(201).json(product);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.put('/products/:id', async (req, res) => {
    try {
        const { name, description, price, images, materials, personalizationOptions, tags, categoryId } = req.body;
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: { name, description, price: parseFloat(price), images, materials, personalizationOptions, tags, categoryId: categoryId || null },
        });
        res.json(product);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// --- Category CRUD ---
router.post('/categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        const cat = await prisma.category.create({ data: { name, description } });
        res.status(201).json(cat);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// --- Orders Management ---
router.get('/orders', async (_req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: { user: { select: { name: true, email: true } }, orderItems: { include: { product: { select: { name: true, images: true, description: true, price: true, materials: true, category: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/orders/:id', async (req, res) => {
    try {
        const { status, deliveryDate, rejectionReason } = req.body;

        // Fetch order with items if needed for notifications
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { user: true, orderItems: true }
        });

        if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

        const updatedOrder = await (prisma.order.update as any)({
            where: { id: req.params.id },
            data: {
                status,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
                rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
            },
            include: { user: true },
        });

        // Handle Rejection logic
        if (status === 'REJECTED') {
            // Logic removed: products are prepared after ordering
        }

        // Notify user via notification record
        let title = 'Order Update 📦';
        let msg = `Your order #${order.id.slice(0, 8)} status updated to: ${status}`;

        if (status === 'ACCEPTED') {
            title = 'Order Accepted! ✅';
            msg = `Your order #${order.id.slice(0, 8)} has been accepted! Estimated delivery: ${deliveryDate || 'TBD'}`;
        } else if (status === 'REJECTED') {
            title = 'Order Rejected ❌';
            msg = `Your order #${order.id.slice(0, 8)} was rejected. Reason: ${rejectionReason || 'No reason provided'}`;
        }

        await (prisma.notification.create as any)({ data: { userId: order.userId, title, message: msg, type: 'USER' } });

        // Send email on status update
        try {
            if (status === 'ACCEPTED' && deliveryDate) {
                await sendOrderAcceptedUser(order.user.email, order.user.name, order.id, String(deliveryDate));
            } else if (status === 'REJECTED') {
                await sendOrderRejectedUser(order.user.email, order.user.name, order.id, rejectionReason || 'No reason provided');
            } else if (['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
                await sendOrderStatusUpdateUser(order.user.email, order.user.name, order.id, status);
            }
        } catch (e) { console.error('Email error:', e); }

        res.json(updatedOrder);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});


// --- Users Management ---
router.get('/users', async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// --- Analytics ---
router.get('/analytics', async (_req, res) => {
    try {
        const [totalUsers, totalProducts, allOrders] = await Promise.all([
            prisma.user.count(),
            prisma.product.count(),
            prisma.order.findMany({
                select: { status: true, totalAmount: true, createdAt: true }
            }),
        ]);

        let totalRevenue = 0;
        let completedOrders = 0;
        let rejectedOrders = 0;
        let pendingOrders = 0;

        const statusDistribution: Record<string, number> = {};
        const revenueByDateMap: Record<string, number> = {};
        const ordersByDateMap: Record<string, number> = {};

        // Generate last 7 days structure
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            revenueByDateMap[dateStr] = 0;
            ordersByDateMap[dateStr] = 0;
        }

        allOrders.forEach(order => {
            // Status counts
            statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;

            if (order.status === 'DELIVERED') completedOrders++;
            else if (order.status === 'REJECTED') rejectedOrders++;
            else pendingOrders++;

            // Revenue calculation: Only count DELIVERED orders
            if (order.status === 'DELIVERED') {
                totalRevenue += order.totalAmount;
            }

            // Time series (group by date) — revenue only from DELIVERED orders
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            if (revenueByDateMap[dateStr] !== undefined) {
                if (order.status === 'DELIVERED') {
                    revenueByDateMap[dateStr] += order.totalAmount;
                }
                ordersByDateMap[dateStr] += 1;
            }
        });

        const revenueTrend = Object.keys(revenueByDateMap).map(date => ({
            date,
            revenue: revenueByDateMap[date],
            orders: ordersByDateMap[date]
        }));

        res.json({
            totalUsers,
            totalOrders: allOrders.length,
            completedOrders,
            rejectedOrders,
            pendingOrders,
            totalProducts,
            totalRevenue,
            statusDistribution: Object.keys(statusDistribution).map(status => ({ name: status, value: statusDistribution[status] })),
            revenueTrend
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Reels Management ---
router.get('/reels', async (_req, res) => {
    try {
        const reels = await prisma.reel.findMany({
            orderBy: { priority: 'desc' },
        });
        res.json(reels);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/reels', async (req, res) => {
    try {
        const { title, videoUrl, thumbnail, priority } = req.body;
        const reel = await prisma.reel.create({
            data: { title, videoUrl, thumbnail, priority: parseInt(priority) || 0 },
        });
        res.status(201).json(reel);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/reels/:id', async (req, res) => {
    try {
        await prisma.reel.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// --- Policies Management ---
router.get('/policies', async (_req, res) => {
    try {
        const policies = await prisma.policy.findMany({ orderBy: { title: 'asc' } });
        res.json(policies);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/policies', async (req, res) => {
    try {
        const { title, slug, content } = req.body;
        const policy = await prisma.policy.create({ data: { title, slug, content } });
        res.status(201).json(policy);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.put('/policies/:id', async (req, res) => {
    try {
        const { title, slug, content } = req.body;
        const policy = await prisma.policy.update({
            where: { id: req.params.id },
            data: { title, slug, content },
        });
        res.json(policy);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/policies/:id', async (req, res) => {
    try {
        await prisma.policy.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
