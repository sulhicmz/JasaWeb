# JasaWeb - Website Development Service Platform

> Modern web platform untuk jasa pembuatan website dengan client portal terintegrasi

![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![PNPM Version](https://img.shields.io/badge/pnpm-%3E%3D8.15.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Gambaran Produk

JasaWeb adalah platform komprehensif untuk bisnis jasa pembuatan website yang terdiri dari:

- **Marketing Site** - Landing page profesional untuk 3 layanan utama (Website Sekolah, Portal Berita, Company Profile)
- **Client Portal** - Dashboard klien untuk manajemen proyek, file, approval, dan tiket support
- **Admin Panel** - Sistem internal untuk manajemen lead, proyek, dan operasional

## 🏗️ Arsitektur Teknis

Proyek ini adalah **monorepo** modern yang terdiri dari:

| Package | Teknologi | Deskripsi |
|---------|-----------|-----------|
| `apps/web` | Astro + Tailwind CSS | Situs marketing & landing page |
| `apps/api` | NestJS + PostgreSQL | REST API untuk client portal |
| `packages/ui` | React + TypeScript | Komponen UI bersama |
| `packages/config` | TypeScript | Konfigurasi & tooling bersama |
| `packages/testing` | Vitest + Playwright | Utilitas testing |

## 🚀 Quick Start

### Prasyarat

- **Node.js** versi 20+ ([download here](https://nodejs.org/))
- **PNPM** package manager ([install guide](https://pnpm.io/installation))

### Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd jasaweb
   ```

2. **Setup environment**
   ```bash
   # Aktifkan corepack untuk versi pnpm yang benar
   corepack enable

   # Install semua dependencies
   pnpm install
   ```

3. **Konfigurasi environment**
   ```bash
   # Copy template environment
   cp .env.example .env

   # Edit .env dengan konfigurasi Anda
   nano .env  # atau editor favorit Anda
   ```

4. **Jalankan services dengan Docker**
   ```bash
   # Start PostgreSQL, Redis, dan MinIO
   pnpm docker:up

   # Atau menggunakan docker-compose langsung
   docker-compose up -d
   ```

5. **Setup database**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Jalankan migrasi database
   pnpm db:migrate
   ```

6. **Jalankan aplikasi**
   ```bash
   # Mode development (web + API paralel)
   pnpm dev

   # Atau jalankan secara terpisah:
   # pnpm dev:web    # Web di http://localhost:4321
   # pnpm dev:api    # API di http://localhost:3000
   ```

## 📁 Struktur Proyek

```
jasaweb/
├── apps/
│   ├── web/              # 🚀 Astro marketing site
│   │   ├── src/pages/    # Routes & pages
│   │   ├── src/components # Reusable components
│   │   └── public/       # Static assets
│   └── api/              # 🔧 NestJS API server
│       ├── src/modules/  # Feature modules
│       ├── prisma/       # Database schema
│       └── templates/    # Email templates
├── packages/
│   ├── ui/               # 🎨 Shared UI components
│   ├── config/           # ⚙️ Shared configuration
│   └── testing/          # 🧪 Testing utilities
├── .github/              # CI/CD workflows
├── docs/
│   ├── plan.md          # 📋 Product specifications
│   └── AGENTS.md        # 👥 Development guidelines
└── docker-compose.yml    # 🐳 Development services
```

## 🛠️ Perintah Development

### Development
```bash
pnpm dev              # Jalankan semua apps (web + API)
pnpm dev:web         # Hanya web app (http://localhost:4321)
pnpm dev:api         # Hanya API server (http://localhost:3000)
```

### Database
```bash
pnpm db:generate     # Generate Prisma client
pnpm db:migrate      # Run database migrations
pnpm db:studio       # Open Prisma Studio
```

### Testing & Quality
```bash
pnpm test            # Run all tests
pnpm test:ui         # Interactive test UI
pnpm test:coverage   # Generate coverage report
pnpm lint           # Run ESLint
pnpm lint:fix       # Auto-fix linting issues
pnpm format         # Format code with Prettier
```

### Docker
```bash
pnpm docker:up       # Start all services
pnpm docker:down     # Stop all services
pnpm docker:logs     # View service logs
```

## 🔧 Konfigurasi Environment

### File Environment

Buat file `.env` berdasarkan template yang disediakan:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jasaweb"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Email Service
RESEND_API_KEY="your-resend-api-key"

# File Storage
AWS_ACCESS_KEY_ID="your-access-key"
S3_BUCKET_NAME="jasaweb-storage"
```

### Services Development

Docker Compose menyediakan:
- **PostgreSQL** (Port 5432) - Database utama
- **Redis** (Port 6379) - Caching & sessions
- **MinIO** (Port 9000) - S3-compatible storage

## 🚢 Deployment

### Production Build
```bash
# Build semua aplikasi
pnpm build

# Build spesifik
pnpm build:web       # Build web app
pnpm build:api       # Build API server
```

### Environment Variables Production
```bash
NODE_ENV=production
DATABASE_URL="your-production-db-url"
JWT_SECRET="your-production-jwt-secret"
# ... lainnya
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test           # Semua tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Dengan coverage report
```

### Testing Strategy
- **Vitest** untuk unit tests yang cepat
- **Playwright** untuk E2E tests (akan datang)
- **Test coverage** ≥ 80% untuk path kritikal

## 📋 Development Workflow

1. **Feature Branch**: `git checkout -b feature/amazing-feature`
2. **Development**: Buat perubahan dengan tests
3. **Quality Check**: `pnpm lint && pnpm test && pnpm build`
4. **Pull Request**: Buat PR dengan deskripsi yang jelas
5. **Code Review**: Review dan approve perubahan
6. **Merge**: Merge ke main branch

## 📚 Dokumentasi

| Dokumentasi | Deskripsi |
|-------------|-----------|
| [📋 plan.md](./plan.md) | Spesifikasi produk & roadmap |
| [👥 AGENTS.md](./AGENTS.md) | Panduan kontribusi & konvensi |
| [🔧 todo.md](./todo.md) | Checklist implementasi |
| [📊 API Docs](http://localhost:3000/api) | Dokumentasi API (Swagger) |

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

### Konvensi Commit
```bash
feat: add new user authentication
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user service
```

## 📄 Lisensi

Proyek ini menggunakan lisensi MIT. Lihat file [LICENSE](./LICENSE) untuk detail lebih lanjut.

## 🆘 Support

Jika Anda menemukan bug atau memiliki pertanyaan:
1. Cek [Issues](../../issues) yang sudah ada
2. Buat issue baru dengan template yang sesuai
3. Berikan detail yang cukup untuk reproduksi masalah

---

**Tim JasaWeb** 🚀