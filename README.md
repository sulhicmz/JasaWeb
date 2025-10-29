# JasaWeb - Web Berbasis Astro untuk Manage Client

Web platform untuk jasa pembuatan website yang terdiri dari situs marketing dan client portal.

## Arsitektur Produk

Proyek ini adalah monorepo yang terdiri dari beberapa komponen utama:

- `apps/web` - Situs marketing berbasis Astro untuk layanan website sekolah, portal berita, dan company profile
- `apps/api` - API berbasis NestJS untuk client portal
- `packages/ui` - Komponen UI bersama
- `packages/config` - Konfigurasi bersama
- `packages/testing` - Utilitas testing bersama

## Prasyarat

- Node.js versi 20+ (gunakan `.nvmrc` untuk konsistensi)
- pnpm (gunakan `corepack enable` untuk mengaktifkan)

## Setup Lokal

1. Clone repository:
   ```bash
   git clone <repository-url>
   cd jasaweb
   ```

2. Aktifkan corepack dan instal dependensi:
   ```bash
   corepack enable
   pnpm install
   ```

3. Buat file konfigurasi environment:
   ```bash
   cp .env.example .env
   # Edit .env dengan konfigurasi lokal Anda
   ```

4. Jalankan layanan development dengan Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. Jalankan aplikasi web:
   ```bash
   pnpm dev
   ```

Aplikasi akan berjalan di [http://localhost:4321](http://localhost:4321).

## Struktur Direktori

```
jasaweb/
├── apps/
│   ├── web/           # Aplikasi Astro untuk situs marketing
│   └── api/           # API NestJS untuk client portal
├── packages/
│   ├── ui/            # Komponen UI bersama
│   ├── config/        # Konfigurasi bersama
│   └── testing/       # Utilitas testing bersama
├── .env.example       # Template konfigurasi environment
├── docker-compose.yml # Konfigurasi layanan development
├── pnpm-workspace.yaml # Konfigurasi workspace pnpm
└── ...
```

## Perintah Pengembangan

- `pnpm dev` - Menjalankan aplikasi web dalam mode development
- `pnpm build` - Membangun aplikasi web untuk produksi
- `pnpm lint` - Menjalankan linter
- `pnpm format` - Memformat kode

## Catatan API

- Endpoint `GET /projects` pada layanan API sekarang mengembalikan ringkasan proyek (dengan metrik jumlah relasi) secara default untuk mengurangi ukuran payload.
- Sertakan parameter kueri `?view=detail` apabila membutuhkan data lengkap beserta relasi proyek.

## Optimasi Terbaru

- Pengambilan metrik proyek kini menggunakan agregasi Prisma yang lebih ringan sehingga statistik seperti milestone selesai dan approval pending dihitung tanpa memuat seluruh daftar entitas ke memori.
- MultiTenant Prisma service mendapatkan helper `count` baru yang otomatis membatasi kueri berdasarkan organisasi aktif untuk memastikan optimasi dapat digunakan ulang oleh modul lain.
- Lihat [docs/optimization-plan.md](./docs/optimization-plan.md) untuk rincian analisis dan rencana optimasi yang telah dijalankan.

## Deployment

Instruksi deployment akan ditambahkan nanti sesuai dengan arsitektur deployment yang direncanakan.

## Dokumentasi Lebih Lanjut

- [Rencana Proyek (plan.md)](./plan.md) - Spesifikasi produk, arsitektur teknis, dan roadmap
- [Panduan Kontribusi (AGENTS.md)](./AGENTS.md) - Panduan untuk kontributor dan konvensi pengembangan