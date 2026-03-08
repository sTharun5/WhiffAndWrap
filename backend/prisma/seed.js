"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Seed categories
    const categoryNames = ['Bouquets', 'Keychains', 'Gift Wraps', 'Personalized Crafts', 'Custom Gifts'];
    for (const name of categoryNames) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name, description: `Handmade ${name.toLowerCase()} crafted with love` },
        });
    }
    // Seed admin
    const adminEmail = 'stharun612@gmail.com';
    const passwordHash = await bcrypt_1.default.hash('123', 12);
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'ADMIN', passwordHash },
        create: {
            email: adminEmail,
            name: 'Admin',
            role: 'ADMIN',
            passwordHash,
        },
    });
    // Seed sample products
    const bouquetsCat = await prisma.category.findUnique({ where: { name: 'Bouquets' } });
    const keychainsCat = await prisma.category.findUnique({ where: { name: 'Keychains' } });
    const giftsCat = await prisma.category.findUnique({ where: { name: 'Custom Gifts' } });
    const sampleProducts = [
        {
            name: 'Enchanted Rose Bouquet',
            description: 'A stunning handcrafted bouquet with preserved roses, eucalyptus, and baby\'s breath. Perfect for any occasion.',
            price: 1499,
            stock: 25,
            images: ['https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600'],
            materials: 'Preserved roses, eucalyptus, baby\'s breath, ribbon',
            personalizationOptions: ['gift_message', 'ribbon_color'],
            tags: ['bouquet', 'roses', 'preserved', 'romantic'],
            categoryId: bouquetsCat?.id,
        },
        {
            name: 'Pastel Dream Bouquet',
            description: 'Soft pastel tones with peonies, lavender and dried flowers. A delicate arrangement for gifting.',
            price: 1199,
            stock: 20,
            images: ['https://images.unsplash.com/photo-1487530811015-1d266f11a4dd?w=600'],
            materials: 'Peonies, lavender, dried flowers, kraft paper',
            personalizationOptions: ['gift_message'],
            tags: ['pastel', 'peonies', 'lavender'],
            categoryId: bouquetsCat?.id,
        },
        {
            name: 'Crystal Heart Keychain',
            description: 'A beautiful personalized crystal-clear heart keychain with your loved one\'s name engraved.',
            price: 349,
            stock: 50,
            images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600'],
            materials: 'Crystal acrylic, metal ring, laser engraving',
            personalizationOptions: ['engraved_name', 'gift_message'],
            tags: ['keychain', 'crystal', 'personalized', 'heart'],
            categoryId: keychainsCat?.id,
        },
        {
            name: 'Boho Macramé Keychain',
            description: 'Hand-knotted macramé keychain with natural cotton and a wooden bead accent.',
            price: 249,
            stock: 40,
            images: ['https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600'],
            materials: 'Cotton cord, wooden beads, metal key ring',
            personalizationOptions: ['gift_message'],
            tags: ['macramé', 'boho', 'keychain', 'handmade'],
            categoryId: keychainsCat?.id,
        },
        {
            name: 'Wildflower Gift Box Set',
            description: 'A curated gift box with handmade wildflower soaps, dried flowers, and a personalized card.',
            price: 1899,
            stock: 15,
            images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600'],
            materials: 'Handmade soaps, dried wildflowers, natural packaging',
            personalizationOptions: ['gift_message', 'custom_image'],
            tags: ['gift box', 'soap', 'wildflower', 'luxury'],
            categoryId: giftsCat?.id,
        },
        {
            name: 'Memory Lane Photo Gift',
            description: 'Upload your favourite photo and we handcraft a beautiful collage with custom framing.',
            price: 2499,
            stock: 10,
            images: ['https://images.unsplash.com/photo-1501746877-14782df58970?w=600'],
            materials: 'Premium photo paper, wooden frame, embellishments',
            personalizationOptions: ['custom_image', 'engraved_name', 'gift_message'],
            tags: ['photo', 'memory', 'custom', 'frame', 'personalized'],
            categoryId: giftsCat?.id,
        },
    ];
    for (const p of sampleProducts) {
        const existing = await prisma.product.findFirst({ where: { name: p.name } });
        if (!existing) {
            await prisma.product.create({ data: p });
        }
    }
    console.log('✅ Seed complete! Admin: stharun612@gmail.com / Password: 123');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
