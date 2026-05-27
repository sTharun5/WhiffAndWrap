"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../prisma");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, auth_1.requireAdmin);
// --- Products CRUD ---
router.get('/products', async (_req, res) => {
    try {
        const products = await prisma_1.prisma.product.findMany({
            include: { category: true, _count: { select: { orderItems: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(products);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/products', async (req, res) => {
    try {
        const { name, description, price, images, materials, personalizationOptions, tags, categoryId, isAvailable } = req.body;
        const product = await prisma_1.prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                images: images || [],
                materials,
                personalizationOptions,
                tags,
                categoryId: categoryId || null,
                isAvailable: isAvailable !== undefined ? isAvailable : true
            },
        });
        // Notify all users about the new product
        const users = await prisma_1.prisma.user.findMany({ where: { role: 'USER' } });
        for (const user of users) {
            await prisma_1.prisma.notification.create({
                data: {
                    userId: user.id,
                    title: 'New Product Available! ✨',
                    message: `We've just added "${name}" to our catalog! Check it out now.`,
                    type: 'USER'
                }
            });
        }
        res.status(201).json(product);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/products/:id', async (req, res) => {
    try {
        const { name, description, price, images, materials, personalizationOptions, tags, categoryId, isAvailable } = req.body;
        const product = await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: {
                name,
                description,
                price: parseFloat(price),
                images,
                materials,
                personalizationOptions,
                tags,
                categoryId: categoryId || null,
                isAvailable: isAvailable !== undefined ? isAvailable : true
            },
        });
        res.json(product);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/products/:id', async (req, res) => {
    try {
        await prisma_1.prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// --- Category CRUD ---
router.post('/categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        const cat = await prisma_1.prisma.category.create({ data: { name, description } });
        res.status(201).json(cat);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/categories/:id', async (req, res) => {
    try {
        await prisma_1.prisma.category.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// --- Orders Management ---
router.get('/orders', async (_req, res) => {
    try {
        const orders = await prisma_1.prisma.order.findMany({
            include: { user: { select: { name: true, email: true } }, orderItems: { include: { product: { select: { name: true, images: true, description: true, price: true, materials: true, category: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.patch('/orders/:id', async (req, res) => {
    try {
        const { status, deliveryDate, rejectionReason } = req.body;
        // Fetch order with items if needed for notifications
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: req.params.id },
            include: { user: true, orderItems: true }
        });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        const updatedOrder = await prisma_1.prisma.order.update({
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
        // In-app notifications for order status updates removed as per user request
        // Send email on status update
        try {
            if (status === 'ACCEPTED' && deliveryDate) {
                await (0, email_1.sendOrderAcceptedUser)(order.user.email, order.user.name, order.id, String(deliveryDate));
            }
            else if (status === 'REJECTED') {
                await (0, email_1.sendOrderRejectedUser)(order.user.email, order.user.name, order.id, rejectionReason || 'No reason provided');
            }
            else if (['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
                await (0, email_1.sendOrderStatusUpdateUser)(order.user.email, order.user.name, order.id, status);
            }
        }
        catch (e) {
            console.error('Email error:', e);
        }
        res.json(updatedOrder);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
// --- Users Management ---
router.get('/users', async (_req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['USER', 'ADMIN'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        // Prevent demoting the last admin
        if (role === 'USER') {
            const adminCount = await prisma_1.prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last admin. Promote another user first.' });
            }
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(user);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
// --- Analytics ---
router.get('/analytics', async (_req, res) => {
    try {
        const [totalUsers, totalProducts, allOrders] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.product.count(),
            prisma_1.prisma.order.findMany({
                select: { status: true, totalAmount: true, createdAt: true }
            }),
        ]);
        let totalRevenue = 0;
        let completedOrders = 0;
        let rejectedOrders = 0;
        let pendingOrders = 0;
        const statusDistribution = {};
        const revenueByDateMap = {};
        const ordersByDateMap = {};
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
            if (order.status === 'DELIVERED')
                completedOrders++;
            else if (order.status === 'REJECTED')
                rejectedOrders++;
            else
                pendingOrders++;
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// --- Reels Management ---
router.get('/reels', async (_req, res) => {
    try {
        const reels = await prisma_1.prisma.reel.findMany({
            orderBy: { priority: 'desc' },
        });
        res.json(reels);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/reels', async (req, res) => {
    try {
        const { title, videoUrl, thumbnail, priority } = req.body;
        const reel = await prisma_1.prisma.reel.create({
            data: { title, videoUrl, thumbnail, priority: parseInt(priority) || 0 },
        });
        res.status(201).json(reel);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/reels/:id', async (req, res) => {
    try {
        await prisma_1.prisma.reel.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// --- Policies Management ---
router.get('/policies', async (_req, res) => {
    try {
        const policies = await prisma_1.prisma.policy.findMany({ orderBy: { title: 'asc' } });
        res.json(policies);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/policies', async (req, res) => {
    try {
        const { title, slug, content } = req.body;
        const policy = await prisma_1.prisma.policy.create({ data: { title, slug, content } });
        res.status(201).json(policy);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/policies/:id', async (req, res) => {
    try {
        const { title, slug, content } = req.body;
        const policy = await prisma_1.prisma.policy.update({
            where: { id: req.params.id },
            data: { title, slug, content },
        });
        res.json(policy);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/policies/:id', async (req, res) => {
    try {
        await prisma_1.prisma.policy.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
