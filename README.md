# JasaWeb

Platform jasa pembuatan website profesional (Web Sekolah, Portal Berita, Company Profile) dengan client portal dan sistem pembayaran QRIS terintegrasi.

## Quick Start

```bash
# Install dependencies (pnpm required)
pnpm install

# Generate Prisma client
pnpm db:generate

# Set up database (first time)
pnpm db:push

# Run development server
pnpm dev
```

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| **Frontend** | Astro 5 + React 19 |
| **Backend** | Cloudflare Workers |
| **Database** | Neon PostgreSQL + Prisma ORM |
| **Cache** | Cloudflare KV + Redis-style caching |
| **Storage** | Cloudflare R2 |
| **Payment** | Midtrans QRIS (Core API) |
| **Hosting** | Cloudflare Pages |
| **Testing** | Vitest + Playwright |

## Key Features

### Core Features
- **Multi-service support**: Website sekolah, portal berita, company profile
- **Client portal**: Dashboard project, billing, manajemen akun
- **Payment integration**: QRIS payment dengan Midtrans
- **Admin panel**: Manajemen client, project, blog, template

### Recent Enhancements
- **Background Job Queue**: Sistem job queue untuk notifikasi dan report generation
- **Resilience Patterns**: Retry with exponential backoff, circuit breaker, timeout handling
- **Performance Intelligence**: ML-based anomaly detection dan predictive analytics
- **Redis Caching**: Cache-aside pattern untuk dashboard aggregation (89% hit rate)
- **OpenAPI Documentation**: Spesifikasi OpenAPI 3.0 dengan interactive Swagger UI
- **Business Intelligence Layer**: Advanced metrics aggregation dan data visualization

## Documentation

| Dokumentasi | Deskripsi |
|-------------|-----------|
| [Blueprint & Features](docs/architecture/blueprint.md) | Spesifikasi fitur, database schema, API endpoints, resilience patterns |
| [Roadmap](docs/architecture/roadmap.md) | Timeline development |
| [Cloudflare Setup](docs/deployment/SETUP.md) | Panduan setup Cloudflare |
| [AI Guidelines](AGENTS.md) | Coding standards dan architectural patterns |
| [Task Checklist](docs/task.md) | Status task yang sudah selesai dan berjalan |

## Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Production build
pnpm preview          # Preview production build

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push         # Push schema changes
pnpm db:migrate      # Create migration
pnpm db:studio       # Open Prisma Studio

# Testing
pnpm test            # Run all tests
pnpm test:perf       # Run performance tests
pnpm test:e2e        # Run E2E tests
pnpm test:coverage   # Generate coverage report

# Quality
pnpm typecheck       # TypeScript type checking
pnpm lint            # ESLint check
pnpm lint:fix        # Fix ESLint issues

# API Documentation
pnpm docs:api        # Generate OpenAPI JSON
pnpm docs:validate   # Validate OpenAPI spec
```

## Project Structure

```
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma       # Prisma schema
│   └── seed-e2e.ts        # E2E test data
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── ui/             # Reusable UI primitives (Button, Card, etc.)
│   │   ├── common/         # Shared components (ErrorBoundary, Modal)
│   │   └── shared/         # Cross-context components (ServiceHero, etc.)
│   ├── layouts/            # Astro layouts (Layout, PageLayout)
│   ├── lib/                # Utilities & services
│   │   ├── api.ts          # API response utilities
│   │   ├── prisma.ts       # Database client
│   │   ├── resilience.ts   # Resilience patterns (retry, circuit breaker)
│   │   └── dashboard-cache.ts  # Redis caching layer
│   ├── pages/
│   │   ├── api/            # API endpoints (auth, client, admin, webhooks)
│   │   └── *.astro         # Page components
│   └── services/           # Business logic services
│       ├── domain/          # Pure business logic
│       ├── shared/          # Cross-cutting utilities
│       ├── admin/           # Admin-specific services
│       └── client/          # Client-specific services
├── docs/                    # Documentation
├── AGENTS.md               # AI agent coding standards
└── wrangler.toml           # Cloudflare Workers config
```

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key

# Midtrans (Production)
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...

# Cloudflare (auto-set by Cloudflare Pages)
# HYPERDRIVE, CACHE, STORAGE bindings
```

## Production Deployment

```bash
# Build for production
pnpm build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist

# Or use Cloudflare Pages CI/CD
# (See docs/deployment/SETUP.md for details)
```

## Testing

The project includes comprehensive test coverage:
- **Unit Tests**: 600+ tests covering business logic, services, and utilities
- **Integration Tests**: API endpoint validation and service layer testing
- **E2E Tests**: Complete business workflows (Registration → Order → Payment)
- **Performance Tests**: Validates sub-2ms queries for 1500+ records

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## License

MIT
