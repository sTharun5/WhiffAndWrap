// @ts-nocheck
/**
 * migrate-heic.ts
 * Converts all existing .heic/.heif files in /uploads to JPEG,
 * then patches Product.images references in the database.
 *
 * Run: npx ts-node prisma/migrate-heic.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';
import process from 'process';
// @ts-ignore
import heicConvert from 'heic-convert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// Using process.cwd() as it is more reliable in various execution environments for CLI scripts
const uploadDir = path.resolve(process.cwd(), 'uploads');

async function convertFile(filePath: string): Promise<string> {
    const base = path.basename(filePath, path.extname(filePath));
    const newPath = path.join(uploadDir, `${base}.jpg`);
    const inputBuffer = fs.readFileSync(filePath);

    // heicConvert might not have proper types, so we cast to any
    const outputBuffer = await (heicConvert as any)({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.88,
    });

    fs.writeFileSync(newPath, Buffer.from(outputBuffer as Buffer));
    fs.unlinkSync(filePath);
    console.log(`  ✅ ${path.basename(filePath)} → ${path.basename(newPath)}`);
    return newPath;
}

async function main() {
    if (!fs.existsSync(uploadDir)) {
        console.error(`❌ Upload directory not found: ${uploadDir}`);
        process.exit(1);
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
    const urlMap: Record<string, string> = {};

    for (const file of heicFiles) {
        try {
            const newPath = await convertFile(path.join(uploadDir, file));
            urlMap[`/uploads/${file}`] = `/uploads/${path.basename(newPath)}`;
        } catch (err) {
            console.error(`  ❌ Failed to convert ${file}:`, err);
        }
    }

    console.log('\n📦 Updating product image URLs in database…\n');
    const products = await prisma.product.findMany({ select: { id: true, images: true } });
    let updatedCount = 0;

    for (const product of products) {
        let images: string[] = [];
        try {
            // Prisma Json field is returned as parsed JS object
            if (Array.isArray(product.images)) {
                images = product.images as string[];
            } else if (typeof product.images === 'string') {
                images = JSON.parse(product.images);
            }
        } catch { continue; }

        if (!images || images.length === 0) continue;

        const updated = images.map((url: string) => urlMap[url] ?? url);
        const hasChanged = updated.some((u, i) => u !== images[i]);

        if (hasChanged) {
            // Prisma expects the actual object for Json fields, not stringified JSON
            await prisma.product.update({
                where: { id: product.id },
                data: { images: updated as any }
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
    prisma.$disconnect().finally(() => process.exit(1));
});
