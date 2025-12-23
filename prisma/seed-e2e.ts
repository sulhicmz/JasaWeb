
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting E2E Seeding...');

    // 1. Clean Database (Optional: use carefully)
    // await prisma.user.deleteMany({ where: { email: { contains: 'test-e2e' } } });

    // 2. Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin-e2e@jasaweb.com' },
        update: {},
        create: {
            name: 'E2E Admin',
            email: 'admin-e2e@jasaweb.com',
            password: adminPassword,
            role: Role.admin,
            phone: '081234567890',
        },
    });
    console.log('✅ Admin user ready:', admin.email);

    // 3. Create Client User
    const clientPassword = await bcrypt.hash('client123', 10);
    const client = await prisma.user.upsert({
        where: { email: 'client-e2e@jasaweb.com' },
        update: {},
        create: {
            name: 'E2E Client',
            email: 'client-e2e@jasaweb.com',
            password: clientPassword,
            role: Role.client,
            phone: '089876543210',
        },
    });
    console.log('✅ Client user ready:', client.email);

    // 4. Ensure Pricing Plans Exist (Critical for Landing Page)
    const plans = [
        { name: 'Basic', price: 500000, description: 'Untuk pemula', features: 'Feature 1, Feature 2' },
        { name: 'Pro', price: 1500000, description: 'Untuk bisnis', features: 'All Basic, Feature 3' },
        { name: 'Enterprise', price: 5000000, description: 'Skala besar', features: 'All Pro, Feature 4' },
    ];

    for (const p of plans) {
        await prisma.pricingPlan.upsert({
            where: { name: p.name },
            update: {},
            create: p,
        });
    }
    console.log('✅ Pricing plans ready');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
