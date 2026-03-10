import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import { authenticate } from '../middleware/auth';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Memory storage — we process every file before saving
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Increased to 50 MB for videos
    fileFilter: (_req, file, cb) => {
        const isImage = /\.(jpeg|jpg|png|webp|heic|heif)$/i.test(path.extname(file.originalname));
        const isVideo = /\.(mp4|mov|webm)$/i.test(path.extname(file.originalname));
        const mimeOk = /^(image|video)\//i.test(file.mimetype) || file.mimetype === 'application/octet-stream';
        (isImage || isVideo || mimeOk) ? cb(null, true) : cb(new Error('Only image and video files are allowed'));
    },
});

/**
 * Convert any image buffer → JPEG / WebP and save to disk.
 * HEIC / HEIF → JPEG via heic-convert (pure JS, works on Mac).
 * All other formats → JPEG via sharp (faster, handles PNG/WebP/JPG).
 */
async function processImage(buffer: Buffer, originalName: string): Promise<string> {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const isHeic = /\.(heic|heif)$/i.test(originalName);

    let outputBuffer: Buffer;
    const ext = '.jpg';

    if (isHeic) {
        // heic-convert: pure JS HEIC decoder — always available
        const raw = await heicConvert({ buffer, format: 'JPEG', quality: 0.88 });
        outputBuffer = Buffer.from(raw);
    } else {
        // sharp: fast JPEG recompress + strip EXIF + auto-rotate
        outputBuffer = await sharp(buffer)
            .rotate()
            .jpeg({ quality: 88, progressive: true })
            .toBuffer();
    }

    const filename = `${unique}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), outputBuffer);
    return filename;
}

// POST /api/upload/image — single
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    try {
        const filename = await processImage(req.file.buffer, req.file.originalname);
        res.json({ url: `/uploads/${filename}` });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Image processing failed' });
    }
});

// POST /api/upload/images — multiple
router.post('/images', authenticate, upload.array('images', 10), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ error: 'No files uploaded' }); return; }
    try {
        const filenames = await Promise.all(files.map(f => processImage(f.buffer, f.originalname)));
        res.json({ urls: filenames.map(f => `/uploads/${f}`) });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Image processing failed' });
    }
});

// POST /api/upload/video — single
router.post('/video', authenticate, upload.single('video'), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    try {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${unique}${ext}`;

        fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
        res.json({ url: `/uploads/${filename}` });
    } catch (err) {
        console.error('Video upload error:', err);
        res.status(500).json({ error: 'Video upload failed' });
    }
});

export default router;
