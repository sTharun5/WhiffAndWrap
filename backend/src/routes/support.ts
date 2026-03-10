import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for screenshots
    fileFilter: (_req, file, cb) => {
        const isImage = /\.(jpeg|jpg|png|webp)$/i.test(path.extname(file.originalname));
        isImage ? cb(null, true) : cb(new Error('Only image files are allowed'));
    },
});

async function processScreenshot(buffer: Buffer): Promise<string> {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${unique}.jpg`;

    await sharp(buffer)
        .rotate()
        .jpeg({ quality: 80 })
        .toFile(path.join(uploadDir, filename));

    return `/uploads/${filename}`;
}

// POST /api/support
// Accessible by anyone (even guests can report issues), but if logged in, we link to their userId
router.post('/', upload.array('screenshots', 5), async (req, res) => {
    try {
        const { email, subject, message, userId } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!email || !subject || !message) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const screenshotUrls = files?.length
            ? await Promise.all(files.map(f => processScreenshot(f.buffer)))
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

// GET /api/support (Admin only, for completeness)
router.get('/', authenticate, async (req, res) => {
    if ((req as any).user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const queries = await prisma.supportQuery.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(queries);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch support queries' });
    }
});

export default router;
