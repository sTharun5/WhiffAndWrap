"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const wishlist_1 = __importDefault(require("./routes/wishlist"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const admin_1 = __importDefault(require("./routes/admin"));
const upload_1 = __importDefault(require("./routes/upload"));
const categories_1 = __importDefault(require("./routes/categories"));
const reels_1 = __importDefault(require("./routes/reels"));
const support_1 = __importDefault(require("./routes/support"));
const policies_1 = __importDefault(require("./routes/policies"));
const app = (0, express_1.default)();
// Security Headers
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
}));
// CORS rules
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
// Parse cookies immediately after CORS
app.use((0, cookie_parser_1.default)());
// Reduce payload limits to prevent memory exhaustion (upload routes handle large forms via multer elsewhere)
app.use(express_1.default.json({ limit: '100kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '100kb' }));
// Rate Limiters
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
    }
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per `window` for auth routes
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many login/registration attempts, please try again later.' });
    }
});
// Apply global rate limiter to all /api routes
app.use('/api', globalLimiter);
// Serve uploaded files with absolute path (required for production)
const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads');
app.use('/uploads', express_1.default.static(uploadsDir));
// Ensure auth paths hit the stricter limiter
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/wishlist', wishlist_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/upload', upload_1.default); // Uses multer which handles large multi-part data correctly
app.use('/api/categories', categories_1.default);
app.use('/api/reels', reels_1.default);
app.use('/api/support', support_1.default);
app.use('/api/policies', policies_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Whiff & Wrap API running - Secured Core Synced' });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Global Error Handler] ${req.method} ${req.url}:`, err.message);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
