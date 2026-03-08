"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../prisma");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
// POST /api/orders - place order
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { items } = req.body; // [{productId, quantity, personalizationData}]
        if (!items || items.length === 0) {
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }
        // Fetch products and validate stock
        const productIds = items.map((i) => i.productId);
        const products = await prisma_1.prisma.product.findMany({ where: { id: { in: productIds } } });
        let totalAmount = 0;
        const orderItemsData = [];
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                res.status(404).json({ error: `Product not found: ${item.productId}` });
                return;
            }
            if (product.stock < item.quantity) {
                res.status(400).json({ error: `Insufficient stock for ${product.name}` });
                return;
            }
            totalAmount += product.price * item.quantity;
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
                personalizationData: item.personalizationData || null,
            });
        }
        const order = await prisma_1.prisma.order.create({
            data: {
                userId: req.user.id,
                totalAmount,
                orderItems: { create: orderItemsData },
            },
            include: { orderItems: { include: { product: true } }, user: true },
        });
        // Decrement stock
        for (const item of items) {
            await prisma_1.prisma.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
            });
        }
        // Notification for the user
        await prisma_1.prisma.notification.create({
            data: {
                userId: req.user.id,
                title: 'Order Placed! 🛍',
                message: `Your order #${order.id.slice(0, 8)} has been successfully placed. We're getting it ready!`,
            },
        });
        // Send email to admin
        try {
            await (0, email_1.sendOrderPlacedAdmin)({
                orderId: order.id,
                userName: req.user.name,
                userEmail: req.user.email,
                items: order.orderItems.map(oi => ({ name: oi.product.name, quantity: oi.quantity, price: oi.price })),
                totalAmount,
            });
        }
        catch (e) {
            console.error('Email error:', e);
        }
        res.status(201).json(order);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /api/orders/my - user's orders
router.get('/my', auth_1.authenticate, async (req, res) => {
    try {
        const orders = await prisma_1.prisma.order.findMany({
            where: { userId: req.user.id },
            include: { orderItems: { include: { product: { select: { name: true, images: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /api/orders/:id
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: req.params.id },
            include: { orderItems: { include: { product: true } }, user: { select: { name: true, email: true } } },
        });
        if (!order) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        res.json(order);
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
