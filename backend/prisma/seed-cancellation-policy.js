const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Cancellation Policy...');

    const policyData = {
        title: 'Order Cancellation Policy',
        slug: 'cancellation-policy',
        content: `
At Whiff & Wrap, we take pride in our "Made to Order" craftsmanship. Every piece is curated specifically for you the moment your order is accepted.

1. NO LAST-MINUTE CANCELLATIONS
To maintain our quality and sustainability standards, we do not allow cancellations once an order has been Accepted by our team or has entered the Preparing stage.

2. CANCELLATION TIMELINE
We understand that minds can change. Here is our allowed window:
- Allowed: Within 1 hour of placing the order, provided the status is still "Placed".
- Strictly Not Allowed: After 1 hour has passed, or once the order status changes to "Accepted" or "Preparing".

3. WHY THIS POLICY?
Since most of our products are personalized or include perishable elements (like fresh flowers in bouquets), the materials are dedicated to your specific order immediately. Last-minute cancellations lead to significant wastage, which we strive to avoid as part of our brand values.

4. HOW TO REQUEST CANCELLATION
If you are within the 1-hour window, please contact us immediately through our Support Page with your Order ID.

5. REFUNDS
Approved cancellations will receive a full refund to the original payment method within 5-7 business days.
        `.trim()
    };

    const policy = await prisma.policy.upsert({
        where: { slug: policyData.slug },
        update: policyData,
        create: policyData,
    });

    console.log('Policy seeded successfully:', policy.title);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
