"use strict";
// @ts-nocheck
/**
 * migrate-heic.ts
 * Converts all existing .heic/.heif files in /uploads to JPEG,
 * then patches Product.images references in the database.
 *
 * Run: npx ts-node prisma/migrate-heic.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const buffer_1 = require("buffer");
const process_1 = __importDefault(require("process"));
// @ts-ignore
const heic_convert_1 = __importDefault(require("heic-convert"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Using process.cwd() as it is more reliable in various execution environments for CLI scripts
const uploadDir = path.resolve(process_1.default.cwd(), 'uploads');
async function convertFile(filePath) {
    const base = path.basename(filePath, path.extname(filePath));
    const newPath = path.join(uploadDir, `${base}.jpg`);
    const inputBuffer = fs.readFileSync(filePath);
    // heicConvert might not have proper types, so we cast to any
    const outputBuffer = await heic_convert_1.default({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.88,
    });
    fs.writeFileSync(newPath, buffer_1.Buffer.from(outputBuffer));
    fs.unlinkSync(filePath);
    console.log(`  ✅ ${path.basename(filePath)} → ${path.basename(newPath)}`);
    return newPath;
}
async function main() {
    if (!fs.existsSync(uploadDir)) {
        console.error(`❌ Upload directory not found: ${uploadDir}`);
        process_1.default.exit(1);
    }
    console.log('\n🔍 Scanning uploads/ for HEIC/HEIF files…\n');
    const files = fs.readdirSync(uploadDir);
    const heicFiles = files.filter(f => /\.(heic|heif)$/i.test(f));
    if (heicFiles.length === 0) {
        console.log('No HEIC files found — nothing to do.\n');
        await prisma.$disconnect();
        return;
    }
    console.log(`Found ${heicFiles.length} HEIC file(s). Converting…\n`);
    const urlMap = {};
    for (const file of heicFiles) {
        try {
            const newPath = await convertFile(path.join(uploadDir, file));
            urlMap[`/uploads/${file}`] = `/uploads/${path.basename(newPath)}`;
        }
        catch (err) {
            console.error(`  ❌ Failed to convert ${file}:`, err);
        }
    }
    console.log('\n📦 Updating product image URLs in database…\n');
    const products = await prisma.product.findMany({ select: { id: true, images: true } });
    let updatedCount = 0;
    for (const product of products) {
        let images = [];
        try {
            // Prisma Json field is returned as parsed JS object
            if (Array.isArray(product.images)) {
                images = product.images;
            }
            else if (typeof product.images === 'string') {
                images = JSON.parse(product.images);
            }
        }
        catch {
            continue;
        }
        if (!images || images.length === 0)
            continue;
        const updated = images.map((url) => urlMap[url] ?? url);
        const hasChanged = updated.some((u, i) => u !== images[i]);
        if (hasChanged) {
            // Prisma expects the actual object for Json fields, not stringified JSON
            await prisma.product.update({
                where: { id: product.id },
                data: { images: updated }
            });
            console.log(`  Updated product ${product.id}`);
            updatedCount++;
        }
    }
    console.log(`\n✅ Done. ${heicFiles.length} file(s) processed, ${updatedCount} product(s) updated.\n`);
    await prisma.$disconnect();
}
main().catch(err => {
    console.error('Migration failed:', err);
    prisma.$disconnect().finally(() => process_1.default.exit(1));
});
