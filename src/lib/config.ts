/**
 * Centralized Site Configuration
 * Single source of truth for all site data
 */

// ==============================================
// ENVIRONMENT VARIABLE VALIDATION
// ==============================================

interface EnvValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

interface EnvSpec {
    name: string;
    required: boolean;
    description: string;
    validator?: (value: string) => boolean;
}

/**
 * Environment Variable Specification
 * Centralized configuration of all required and optional environment variables
 */
const ENV_VARS: EnvSpec[] = [
    // Core Application
    {
        name: 'NODE_ENV',
        required: false,
        description: 'Application environment (development/production)',
        validator: (value) => ['development', 'production', 'test'].includes(value),
    },
    
    // Database (Neon PostgreSQL)
    {
        name: 'DATABASE_URL',
        required: true,
        description: 'Neon PostgreSQL connection string',
        validator: (value) => value.startsWith('postgresql://') && value.includes('sslmode=require'),
    },
    
    // Authentication
    {
        name: 'JWT_SECRET',
        required: true,
        description: 'JWT signing secret (min 32 characters)',
        validator: (value) => value.length >= 32,
    },
    
    // Midtrans Payment Gateway
    {
        name: 'MIDTRANS_SERVER_KEY',
        required: true,
        description: 'Midtrans server key for payment processing',
        validator: (value) => value.startsWith('SB-Mid-server-') || value.startsWith('Mid-server-'),
    },
    {
        name: 'MIDTRANS_CLIENT_KEY',
        required: true,
        description: 'Midtrans client key for frontend payment integration',
        validator: (value) => value.startsWith('SB-Mid-client-') || value.startsWith('Mid-client-'),
    },
    {
        name: 'MIDTRANS_IS_PRODUCTION',
        required: false,
        description: 'Midtrans production mode flag (true/false)',
        validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    },
    
    // Optional: Cloudflare (usually managed by platform)
    {
        name: 'CLOUDFLARE_API_TOKEN',
        required: false,
        description: 'Cloudflare API Token for R2/KV operations (if needed)',
    },
];

/**
 * Validate a single environment variable
 */
function validateEnvVar(spec: EnvSpec, value: string | undefined): { isValid: boolean; error?: string } {
    if (spec.required && !value) {
        return {
            isValid: false,
            error: `Required environment variable '${spec.name}' is missing`
        };
    }
    
    if (!value && !spec.required) {
        return { isValid: true };
    }
    
    if (spec.validator && value && !spec.validator(value)) {
        return {
            isValid: false,
            error: `Environment variable '${spec.name}' has invalid value. Expected: ${spec.description}`
        };
    }
    
    return { isValid: true };
}

/**
 * Validate all environment variables
 * This should be called during application startup
 */
export function validateEnvironment(): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const spec of ENV_VARS) {
        const value = import.meta.env[spec.name];
        const result = validateEnvVar(spec, value);
        
        if (!result.isValid) {
            errors.push(result.error!);
        }
        
        // Check for common misconfigurations
        if (value && spec.name.includes('SECRET') && value.length < 32) {
            warnings.push(`'${spec.name}' should be at least 32 characters for security`);
        }
        
        if (value && spec.name.includes('KEY') && value.includes('xxx')) {
            warnings.push(`'${spec.name}' appears to be using placeholder value`);
        }
    }
    
    // Additional cross-variable validation
    const isProduction = import.meta.env.NODE_ENV === 'production';
    
    if (isProduction) {
        const requiredInProd = ['DATABASE_URL', 'JWT_SECRET', 'MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY'];
        for (const varName of requiredInProd) {
            if (!import.meta.env[varName]) {
                errors.push(`'${varName}' is required in production environment`);
            }
        }
    }
    
    // Check for development vs production Midtrans configuration
    const midtransServerKey = import.meta.env.MIDTRANS_SERVER_KEY;
    const midtransIsProduction = import.meta.env.MIDTRANS_IS_PRODUCTION === 'true';
    
    if (midtransServerKey) {
        const isSandboxKey = midtransServerKey.startsWith('SB-Mid-server-');
        if (isSandboxKey && midtransIsProduction) {
            warnings.push('Using sandbox Midtrans key in production environment');
        }
        if (!isSandboxKey && !midtransIsProduction) {
            warnings.push('Using production Midtrans key in development environment');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Get environment configuration summary (safe to display)
 */
export function getEnvironmentInfo(): {
    environment: string;
    database: 'configured' | 'missing';
    payment: 'configured' | 'missing';
    auth: 'configured' | 'missing';
} {
    const database = import.meta.env.DATABASE_URL ? 'configured' : 'missing';
    const payment = (import.meta.env.MIDTRANS_SERVER_KEY && import.meta.env.MIDTRANS_CLIENT_KEY) ? 'configured' : 'missing';
    const auth = import.meta.env.JWT_SECRET ? 'configured' : 'missing';
    
    return {
        environment: import.meta.env.NODE_ENV || 'unknown',
        database,
        payment,
        auth,
    };
}

// ==============================================
// SITE METADATA
// ==============================================
export const siteConfig = {
    name: 'JasaWeb',
    tagline: 'Platform Jasa Pembuatan Website Profesional',
    description: 'Kami membantu Anda membuat website sekolah, portal berita, dan company profile dengan kualitas premium.',
    url: 'https://jasaweb.id',
    email: 'hello@jasaweb.id',
    phone: '+62 812 3456 7890',
} as const;

// ==============================================
// NAVIGATION
// ==============================================
export const navLinks = [
    { href: '/layanan', label: 'Layanan' },
    { href: '/template', label: 'Template' },
    { href: '/pricing', label: 'Harga' },
    { href: '/blog', label: 'Blog' },
] as const;

export const footerLinks = {
    layanan: [
        { href: '/layanan/sekolah', label: 'Web Sekolah' },
        { href: '/layanan/berita', label: 'Portal Berita' },
        { href: '/layanan/company', label: 'Company Profile' },
    ],
    perusahaan: [
        { href: '/tentang', label: 'Tentang Kami' },
        { href: '/pricing', label: 'Harga' },
        { href: '/blog', label: 'Blog' },
    ],
    lainnya: [
        { href: '/template', label: 'Template' },
        { href: '/kontak', label: 'Kontak' },
        { href: '/faq', label: 'FAQ' },
    ],
} as const;

// ==============================================
// SERVICES
// ==============================================
export type ServiceId = 'sekolah' | 'berita' | 'company';

// Template categories - extracted from inline hardcode
export const templateCategories = [
  { value: 'all' as const, label: 'Semua' },
  { value: 'sekolah', label: 'Web Sekolah' },
  { value: 'berita', label: 'Portal Berita' },
  { value: 'company', label: 'Company Profile' },
] as const;

export type TemplateCategory = typeof templateCategories[number]['value'];

export interface ServiceFeature {
    icon: string;
    title: string;
    description: string;
}

export interface ServiceConfig {
    id: ServiceId;
    icon: string;
    title: string;
    shortTitle: string;
    description: string;
    price: number;
    priceFormatted: string;
    popular: boolean;
    color: 'primary' | 'secondary' | 'success';
    features: ServiceFeature[];
    highlights: string[];
}

export const services: Record<ServiceId, ServiceConfig> = {
    sekolah: {
        id: 'sekolah',
        icon: '🏫',
        title: 'Web Sekolah',
        shortTitle: 'Sekolah',
        description: 'Website lengkap untuk sekolah dengan PPDB online, berita, galeri, profil guru, dan informasi akademik.',
        price: 2500000,
        priceFormatted: 'Rp 2.500.000',
        popular: false,
        color: 'primary',
        features: [
            { icon: '📝', title: 'PPDB Online', description: 'Sistem pendaftaran peserta didik baru yang terintegrasi' },
            { icon: '👨‍🏫', title: 'Profil Guru & Staf', description: 'Halaman profil lengkap untuk guru dan tenaga pendidik' },
            { icon: '📸', title: 'Galeri Foto', description: 'Galeri foto kegiatan sekolah dengan album terorganisir' },
            { icon: '📢', title: 'Berita & Pengumuman', description: 'Sistem berita dan pengumuman dengan notifikasi' },
            { icon: '📅', title: 'Kalender Akademik', description: 'Kalender kegiatan dan jadwal akademik interaktif' },
            { icon: '🏆', title: 'Prestasi', description: 'Showcase prestasi siswa dan sekolah' },
        ],
        highlights: ['10+ Halaman', 'PPDB Online', 'Galeri Foto', 'Berita & Pengumuman', 'Profil Guru', 'Support 60 Hari'],
    },
    berita: {
        id: 'berita',
        icon: '📰',
        title: 'Portal Berita',
        shortTitle: 'Berita',
        description: 'Platform berita modern dengan CMS lengkap, kategori, tag, dan optimasi SEO untuk meningkatkan traffic.',
        price: 3500000,
        priceFormatted: 'Rp 3.500.000',
        popular: true,
        color: 'secondary',
        features: [
            { icon: '✍️', title: 'CMS Lengkap', description: 'Editor artikel dengan formatting, gambar, dan media embed' },
            { icon: '📁', title: 'Multi Kategori', description: 'Organisasi artikel dengan kategori dan tag fleksibel' },
            { icon: '🔍', title: 'SEO Optimized', description: 'Meta tags, sitemap, dan struktur SEO-friendly' },
            { icon: '📱', title: 'Social Sharing', description: 'Integrasi sharing ke berbagai platform sosial media' },
            { icon: '💬', title: 'Sistem Komentar', description: 'Kolom komentar dengan moderasi dan anti-spam' },
            { icon: '📊', title: 'Analytics', description: 'Dashboard statistik pengunjung dan artikel populer' },
        ],
        highlights: ['Unlimited Artikel', 'CMS Lengkap', 'Multi Kategori', 'SEO Advanced', 'Analytics Dashboard', 'Support 90 Hari'],
    },
    company: {
        id: 'company',
        icon: '🏢',
        title: 'Company Profile',
        shortTitle: 'Company',
        description: 'Website perusahaan profesional dengan desain elegan untuk meningkatkan kredibilitas bisnis Anda.',
        price: 2000000,
        priceFormatted: 'Rp 2.000.000',
        popular: false,
        color: 'success',
        features: [
            { icon: '🎨', title: 'Desain Premium', description: 'Template profesional dengan customisasi warna dan font' },
            { icon: '📄', title: 'Halaman Layanan', description: 'Showcase layanan perusahaan dengan detail lengkap' },
            { icon: '💼', title: 'Portfolio', description: 'Galeri proyek dan hasil kerja perusahaan' },
            { icon: '⭐', title: 'Testimoni', description: 'Tampilkan review dan testimoni dari klien' },
            { icon: '📩', title: 'Form Kontak', description: 'Formulir kontak dengan notifikasi email' },
            { icon: '📍', title: 'Lokasi & Maps', description: 'Integrasi Google Maps untuk lokasi kantor' },
        ],
        highlights: ['5 Halaman', 'Desain Responsif', 'Form Kontak', 'Integrasi Maps', 'SEO Basic', 'Support 30 Hari'],
    },
} as const;

// Helper to get services as array
export const servicesArray = Object.values(services);

// ==============================================
// PRICING
// ==============================================
export interface PricingTier {
    id: ServiceId;
    name: string;
    price: number;
    priceFormatted: string;
    description: string;
    features: string[];
    popular: boolean;
    color: 'primary' | 'success' | 'warning';
}

export const pricingTiers: PricingTier[] = [
    {
        id: 'company',
        name: 'Company Profile',
        price: 2000000,
        priceFormatted: 'Rp 2.000.000',
        description: 'Website perusahaan profesional',
        features: ['5 Halaman', 'Desain Responsif', 'Form Kontak', 'Integrasi Maps', 'SEO Basic', 'Support 30 Hari'],
        popular: false,
        color: 'success',
    },
    {
        id: 'sekolah',
        name: 'Web Sekolah',
        price: 2500000,
        priceFormatted: 'Rp 2.500.000',
        description: 'Website lengkap untuk sekolah',
        features: ['10+ Halaman', 'PPDB Online', 'Galeri Foto', 'Berita & Pengumuman', 'Profil Guru', 'Support 60 Hari'],
        popular: false,
        color: 'primary',
    },
    {
        id: 'berita',
        name: 'Portal Berita',
        price: 3500000,
        priceFormatted: 'Rp 3.500.000',
        description: 'Platform berita modern',
        features: ['Unlimited Artikel', 'CMS Lengkap', 'Multi Kategori', 'SEO Advanced', 'Analytics Dashboard', 'Support 90 Hari'],
        popular: true,
        color: 'warning',
    },
];

// ==============================================
// FAQ
// ==============================================
export interface FAQItem {
    question: string;
    answer: string;
}

export const faqs: FAQItem[] = [
    { question: 'Berapa lama waktu pengerjaan?', answer: 'Pengerjaan memakan waktu 7-14 hari kerja tergantung kompleksitas project.' },
    { question: 'Apakah termasuk hosting dan domain?', answer: 'Ya, semua paket sudah termasuk hosting 1 tahun dan domain .com gratis.' },
    { question: 'Bagaimana cara pembayaran?', answer: 'Pembayaran dilakukan via transfer bank atau QRIS. DP 50% di awal, pelunasan setelah selesai.' },
    { question: 'Apakah ada garansi?', answer: 'Ya, kami memberikan garansi bug fix gratis selama masa support berlaku.' },
];

// ==============================================
// TEMPLATES (Static - will be DB later)
// ==============================================
export interface TemplateItem {
    id: string;
    name: string;
    category: ServiceId;
    imageUrl: string;
    demoUrl: string;
}

export const templates: TemplateItem[] = [
    { id: '1', name: 'EduPrime', category: 'sekolah', imageUrl: '/templates/eduprime.jpg', demoUrl: '#' },
    { id: '2', name: 'SchoolHub', category: 'sekolah', imageUrl: '/templates/schoolhub.jpg', demoUrl: '#' },
    { id: '3', name: 'NewsFlow', category: 'berita', imageUrl: '/templates/newsflow.jpg', demoUrl: '#' },
    { id: '4', name: 'MediaPulse', category: 'berita', imageUrl: '/templates/mediapulse.jpg', demoUrl: '#' },
    { id: '5', name: 'CorporateX', category: 'company', imageUrl: '/templates/corporatex.jpg', demoUrl: '#' },
    { id: '6', name: 'BrandPro', category: 'company', imageUrl: '/templates/brandpro.jpg', demoUrl: '#' },
];

// ==============================================
// UTILITIES
// ==============================================
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function getServiceById(id: ServiceId): ServiceConfig {
    return services[id];
}

export function getCategoryLabel(category: ServiceId): string {
    const labels: Record<ServiceId, string> = {
        sekolah: '🏫 Web Sekolah',
        berita: '📰 Portal Berita',
        company: '🏢 Company Profile',
    };
    return labels[category];
}
