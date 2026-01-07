# JasaWeb

Professional web development platform (School Websites, News Portals, Company Profiles) with client portal and integrated QRIS payment system.

## Quick Start

### Prerequisites
- Node.js 20+ 
- pnpm (recommended) or npm/yarn
- Neon PostgreSQL account (free tier available)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/jasaweb/jasaweb.git
cd jasaweb

# Install dependencies (pnpm required)
pnpm install

# Copy environment variables
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your credentials
# DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/jasaweb
# JWT_SECRET=your-secret-key
# MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
# MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Generate Prisma client
pnpm db:generate

# Set up database (first time only)
pnpm db:push

# Run development server
pnpm dev
```

The application will be available at [http://localhost:4321](http://localhost:4321)

## Tech Stack

| Component | Technology |
|-----------|------------|
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
- **Multi-service support**: School websites, news portals, company profiles
- **Client portal**: Project dashboard, billing, account management
- **Payment integration**: QRIS payment with Midtrans
- **Admin panel**: Client management, projects, blog, templates

### Recent Enhancements
- **Background Job Queue**: Sistem job queue untuk notifikasi dan report generation
- **Resilience Patterns**: Retry with exponential backoff, circuit breaker, timeout handling
- **Performance Intelligence**: ML-based anomaly detection dan predictive analytics
- **Redis Caching**: Cache-aside pattern untuk dashboard aggregation (89% hit rate)
- **OpenAPI Documentation**: Spesifikasi OpenAPI 3.0 dengan interactive Swagger UI
- **Business Intelligence Layer**: Advanced metrics aggregation dan data visualization

## Documentation

| Documentation | Description |
|---------------|-------------|
| [API Documentation](docs/api-documentation.md) | REST API reference with authentication and examples |
| [Architecture Blueprint](docs/blueprint.md) | Feature specifications, database schema, API endpoints, resilience patterns |
| [Roadmap](docs/architecture/roadmap.md) | Development timeline and milestones |
| [Cloudflare Setup](docs/deployment/SETUP.md) | Cloudflare deployment guide |
| [AI Guidelines](AGENTS.md) | Coding standards and architectural patterns |
| [Task Checklist](docs/task.md) | Task status and progress |

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
