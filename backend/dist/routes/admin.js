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
        const { name, description, price, stock, images, materials, personalizationOptions, tags, categoryId } = req.body;
        const product = await prisma_1.prisma.product.create({
            data: { name, description, price: parseFloat(price), stock: parseInt(stock), images: images || [], materials, personalizationOptions, tags, categoryId: categoryId || null },
        });
        res.status(201).json(product);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/products/:id', async (req, res) => {
    try {
        const { name, description, price, stock, images, materials, personalizationOptions, tags, categoryId } = req.body;
        const product = await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: { name, description, price: parseFloat(price), stock: parseInt(stock), images, materials, personalizationOptions, tags, categoryId: categoryId || null },
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
            include: { user: { select: { name: true, email: true } }, orderItems: { include: { product: { select: { name: true, images: true } } } } },
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
        const { status, deliveryDate } = req.body;
        const order = await prisma_1.prisma.order.update({
            where: { id: req.params.id },
            data: { status, deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined },
            include: { user: true },
        });
        // Notify user via notification record
        const title = status === 'ACCEPTED' ? 'Order Accepted! ✅' : 'Order Update 📦';
        const msg = status === 'ACCEPTED'
            ? `Your order #${order.id.slice(0, 8)} has been accepted! Estimated delivery: ${deliveryDate || 'TBD'}`
            : `Your order #${order.id.slice(0, 8)} status updated to: ${status}`;
        await prisma_1.prisma.notification.create({ data: { userId: order.userId, title, message: msg } });
        // Send email on status update
        try {
            if (status === 'ACCEPTED' && deliveryDate) {
                await (0, email_1.sendOrderAcceptedUser)(order.user.email, order.user.name, order.id, deliveryDate);
            }
            else if (['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
                await (0, email_1.sendOrderStatusUpdateUser)(order.user.email, order.user.name, order.id, status);
            }
        }
        catch (e) {
            console.error('Email error:', e);
        }
        res.json(order);
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
// --- Analytics ---
router.get('/analytics', async (_req, res) => {
    try {
        const [totalUsers, totalOrders, totalProducts, ordersData] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.order.count(),
            prisma_1.prisma.product.count(),
            prisma_1.prisma.order.aggregate({ _sum: { totalAmount: true } }),
        ]);
        res.json({
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue: ordersData._sum.totalAmount || 0,
        });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
