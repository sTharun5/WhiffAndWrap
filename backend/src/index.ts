import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

dotenv.config();

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import wishlistRoutes from './routes/wishlist';
import reviewRoutes from './routes/reviews';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import categoryRoutes from './routes/categories';
import reelRoutes from './routes/reels';
import supportRoutes from './routes/support';
import policyRoutes from './routes/policies';

const app = express();

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
}));

// CORS rules
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Parse cookies immediately after CORS
app.use(cookieParser());

// Reduce payload limits to prevent memory exhaustion (upload routes handle large forms via multer elsewhere)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per `window` for auth routes
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many login/registration attempts, please try again later.' });
    }
});

// Apply global rate limiter to all /api routes
app.use('/api', globalLimiter);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Ensure auth paths hit the stricter limiter
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes); // Uses multer which handles large multi-part data correctly
app.use('/api/categories', categoryRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/policies', policyRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Whiff & Wrap API running - Secured Core Synced' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Global Error Handler] ${req.method} ${req.url}:`, err.message);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
