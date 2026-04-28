import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Configure Cloudinary (shared config, but harmless to call again)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // max 5 support submissions per IP per hour
    handler: (_req, res) => {
        res.status(429).json({ error: 'Too many support requests. Please try again in an hour.' });
    }
});

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for screenshots
    fileFilter: (_req, file, cb) => {
        const isImage = /\.(jpeg|jpg|png|webp)$/i.test(path.extname(file.originalname));
        isImage ? cb(null, true) : cb(new Error('Only image files are allowed'));
    },
});

/** Upload screenshot buffer to Cloudinary */
function uploadScreenshot(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'whiff-wrap/support', resource_type: 'image', transformation: [{ quality: 'auto' }] },
            (error, result) => {
                if (error || !result) return reject(error || new Error('Upload failed'));
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
}

// POST /api/support — rate limited, accessible by all (guests too)
router.post('/', supportLimiter, upload.array('screenshots', 5), async (req, res) => {
    try {
        const { email, subject, message, userId } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!email || !subject || !message) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const screenshotUrls = files?.length
            ? await Promise.all(files.map(f => uploadScreenshot(f.buffer)))
            : [];

        const query = await prisma.supportQuery.create({
            data: {
                email,
                subject,
                message,
                userId: userId || null,
                screenshots: screenshotUrls,
                status: 'OPEN'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Support query submitted successfully',
            queryId: query.id
        });
    } catch (err) {
        console.error('Support submission error:', err);
        res.status(500).json({ error: 'Failed to submit support query' });
    }
});

// GET /api/support — Admin only
router.get('/', authenticate, requireAdmin, async (_req, res) => {
    try {
        const queries = await prisma.supportQuery.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(queries);
    } catch {
        res.status(500).json({ error: 'Failed to fetch support queries' });
    }
});

// PATCH /api/support/:id — Admin: update status
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const id = String(req.params.id);
        if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' }); return;
        }
        const query = await prisma.supportQuery.update({
            where: { id },
            data: { status: String(status) }
        });
        res.json(query);
    } catch {
        res.status(500).json({ error: 'Failed to update support query' });
    }
});

export default router;
