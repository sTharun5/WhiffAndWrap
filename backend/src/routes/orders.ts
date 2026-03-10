import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../prisma';
import { sendOrderPlacedAdmin } from '../services/email';

const router = Router();

// POST /api/orders - place order
router.post('/', authenticate, async (req: any, res) => {
    try {
        const { items, phoneNumber } = req.body; // [{productId, quantity, personalizationData}], phoneNumber
        if (!items || items.length === 0) {
            res.status(400).json({ error: 'Cart is empty' }); return;
        }
        if (!phoneNumber) {
            res.status(400).json({ error: 'Phone number is required' }); return;
        }

        // Fetch products
        const productIds = items.map((i: any) => i.productId);
        const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

        let totalAmount = 0;
        const orderItemsData: any[] = [];
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) { res.status(404).json({ error: `Product not found: ${item.productId}` }); return; }

            // CRITICAL: Prevent negative or fractional quantities
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                res.status(400).json({ error: `Invalid quantity for product: ${item.productId}. Must be a positive integer.` });
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

        const order = await (prisma.order.create as any)({
            data: {
                userId: req.user.id,
                phoneNumber,
                totalAmount,
                orderItems: { create: orderItemsData },
            },
            include: { orderItems: { include: { product: true } }, user: true },
        });

        // Notification for the user
        const notificationData = {
            userId: req.user.id,
            title: 'Order Placed! 🛍',
            message: `Your order #${order.id.slice(0, 8)} has been successfully placed. We're getting it ready!`,
            type: 'USER',
        };
        await (prisma.notification.create as any)({
            data: notificationData,
        });

        // Notify all admins with internal notification (concise)
        const productSummary = order.orderItems.map(oi => `${oi.product.name} (x${oi.quantity})`).join(', ');
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
            await (prisma.notification.create as any)({
                data: {
                    userId: admin.id,
                    title: 'New Order! 📦',
                    message: `New order #${order.id.slice(0, 8)} by ${req.user.name}: ${productSummary}`,
                    type: 'ADMIN',
                },
            });
        }

        // Send detailed email to admin
        try {
            await sendOrderPlacedAdmin({
                orderId: order.id,
                userName: req.user.name,
                userEmail: req.user.email,
                phoneNumber: phoneNumber,
                items: order.orderItems.map(oi => ({
                    name: oi.product.name,
                    quantity: oi.quantity,
                    price: oi.price,
                    image: (oi.product.images as string[])?.[0]
                })),
                totalAmount,
            });
        } catch (e) { console.error('Email error:', e); }

        res.status(201).json(order);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/orders/my - user's orders
router.get('/my', authenticate, async (req: any, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.id },
            include: { orderItems: { include: { product: { select: { name: true, images: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: any, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { orderItems: { include: { product: true } }, user: { select: { name: true, email: true } } },
        });
        if (!order) { res.status(404).json({ error: 'Not found' }); return; }
        if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' }); return;
        }
        res.json(order);
    } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
