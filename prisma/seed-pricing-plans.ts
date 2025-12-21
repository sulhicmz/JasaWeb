// Seed initial pricing plans matching the existing hardcoded configuration
import { getPrisma } from '../src/lib/prisma.js';

const mockEnv = {} as any; // Database seeding runs in server context

async function seedPricingPlans() {
  const prisma = getPrisma(mockEnv);

  // Check if pricing plans already exist
  const existingCount = await (prisma as any).pricingPlan?.count?.({
    where: { isActive: true }
  }) || 0;

  if (existingCount > 0) {
    console.log('Pricing plans already exist, skipping seeding');
    return;
  }

  // Initial pricing data - matching the existing hardcoded config
  const pricingPlans = [
    {
      identifier: 'company',
      name: 'Company Profile',
      price: 2000000, // Rp 2.000.000
      description: 'Website perusahaan profesional',
      features: ['5 Halaman', 'Desain Responsif', 'Form Kontak', 'Integrasi Maps', 'SEO Basic', 'Support 30 Hari'],
      popular: false,
      color: 'success',
      sortOrder: 1,
    },
    {
      identifier: 'sekolah',
      name: 'Web Sekolah',
      price: 2500000, // Rp 2.500.000
      description: 'Website lengkap untuk sekolah',
      features: ['10+ Halaman', 'PPDB Online', 'Galeri Foto', 'Berita & Pengumuman', 'Profil Guru', 'Support 60 Hari'],
      popular: false,
      color: 'primary',
      sortOrder: 2,
    },
    {
      identifier: 'berita',
      name: 'Portal Berita',
      price: 3500000, // Rp 3.500.000
      description: 'Platform berita modern',
      features: ['Unlimited Artikel', 'CMS Lengkap', 'Multi Kategori', 'SEO Advanced', 'Analytics Dashboard', 'Support 90 Hari'],
      popular: true,
      color: 'warning',
      sortOrder: 3,
    },
  ];

  try {
    // Insert pricing plans
    for (const plan of pricingPlans) {
      await (prisma as any).pricingPlan?.create?.({
        data: plan,
      });
    }

    console.log(`✅ Created ${pricingPlans.length} pricing plans`);
  } catch (error) {
    console.error('❌ Failed to seed pricing plans:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPricingPlans()
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      // Note: In a real environment, you'd need to handle disconnection
      // Since we're using Cloudflare Workers with Hyperdrive, connection is managed differently
    });
}

export { seedPricingPlans };