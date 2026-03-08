"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const heic_convert_1 = __importDefault(require("heic-convert"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
// Memory storage — we process every file before saving
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (_req, file, cb) => {
        const extOk = /\.(jpeg|jpg|png|webp|heic|heif)$/i.test(path_1.default.extname(file.originalname));
        const mimeOk = /^image\//i.test(file.mimetype) || file.mimetype === 'application/octet-stream';
        (extOk || mimeOk) ? cb(null, true) : cb(new Error('Only image files are allowed'));
    },
});
/**
 * Convert any image buffer → JPEG / WebP and save to disk.
 * HEIC / HEIF → JPEG via heic-convert (pure JS, works on Mac).
 * All other formats → JPEG via sharp (faster, handles PNG/WebP/JPG).
 */
async function processImage(buffer, originalName) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const isHeic = /\.(heic|heif)$/i.test(originalName);
    let outputBuffer;
    const ext = '.jpg';
    if (isHeic) {
        // heic-convert: pure JS HEIC decoder — always available
        const raw = await (0, heic_convert_1.default)({ buffer, format: 'JPEG', quality: 0.88 });
        outputBuffer = Buffer.from(raw);
    }
    else {
        // sharp: fast JPEG recompress + strip EXIF + auto-rotate
        outputBuffer = await (0, sharp_1.default)(buffer)
            .rotate()
            .jpeg({ quality: 88, progressive: true })
            .toBuffer();
    }
    const filename = `${unique}${ext}`;
    fs_1.default.writeFileSync(path_1.default.join(uploadDir, filename), outputBuffer);
    return filename;
}
// POST /api/upload/image — single
router.post('/image', auth_1.authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    try {
        const filename = await processImage(req.file.buffer, req.file.originalname);
        res.json({ url: `/uploads/${filename}` });
    }
    catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Image processing failed' });
    }
});
// POST /api/upload/images — multiple
router.post('/images', auth_1.authenticate, upload.array('images', 10), async (req, res) => {
    const files = req.files;
    if (!files?.length) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
    }
    try {
        const filenames = await Promise.all(files.map(f => processImage(f.buffer, f.originalname)));
        res.json({ urls: filenames.map(f => `/uploads/${f}`) });
    }
    catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Image processing failed' });
    }
});
exports.default = router;
