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
            include: { user: { select: { name: true, email: true } }, orderItems: { include: { product: { select: { name: true, images: true, description: true, price: true, stock: true, materials: true, category: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/orders/:id', async (req, res) => {
    try {
        const { status, deliveryDate, rejectionReason } = req.body;

        // Fetch order with items to handle stock restoration if rejected
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

        // Handle Rejection logic (No stock restoration needed as per new requirement)
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
        const [totalUsers, totalOrders, totalProducts, ordersData] = await Promise.all([
            prisma.user.count(),
            prisma.order.count(),
            prisma.product.count(),
            prisma.order.aggregate({ _sum: { totalAmount: true } }),
        ]);
        res.json({
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue: ordersData._sum.totalAmount || 0,
        });
    } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
