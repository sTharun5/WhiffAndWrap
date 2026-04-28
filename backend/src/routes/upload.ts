import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage — we stream every file directly to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (Cloudinary handles large videos)
    fileFilter: (_req, file, cb) => {
        const isImage = /\.(jpeg|jpg|png|webp|heic|heif)$/i.test(path.extname(file.originalname));
        const isVideo = /\.(mp4|mov|webm)$/i.test(path.extname(file.originalname));
        const mimeOk = /^(image|video)\//i.test(file.mimetype) || file.mimetype === 'application/octet-stream';
        (isImage || isVideo || mimeOk) ? cb(null, true) : cb(new Error('Only image and video files are allowed'));
    },
});

/**
 * Upload a buffer to Cloudinary.
 * resourceType: 'image' | 'video' | 'raw'
 * folder: organise assets in Cloudinary dashboard
 */
function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<string> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                // For images: auto quality + format optimisation
                ...(resourceType === 'image' && {
                    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
                }),
            },
            (error, result) => {
                if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
}

// POST /api/upload/image — single image
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    try {
        const url = await uploadToCloudinary(req.file.buffer, 'whiff-wrap/products', 'image');
        res.json({ url });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Image upload failed' });
    }
});

// POST /api/upload/images — multiple images (up to 10)
router.post('/images', authenticate, upload.array('images', 10), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ error: 'No files uploaded' }); return; }
    try {
        const urls = await Promise.all(
            files.map(f => uploadToCloudinary(f.buffer, 'whiff-wrap/products', 'image'))
        );
        res.json({ urls });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Image upload failed' });
    }
});

// POST /api/upload/video — single video (reels)
router.post('/video', authenticate, upload.single('video'), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    try {
        const url = await uploadToCloudinary(req.file.buffer, 'whiff-wrap/reels', 'video');
        res.json({ url });
    } catch (err) {
        console.error('Video upload error:', err);
        res.status(500).json({ error: 'Video upload failed' });
    }
});

export default router;
