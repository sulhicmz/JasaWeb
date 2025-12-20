/**
 * Centralized Site Configuration
 * Single source of truth for all site data
 */

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
