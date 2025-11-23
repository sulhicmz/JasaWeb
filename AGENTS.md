# Qwen Code Project Context - JasaWeb

## Project Overview
This is a web-based service for managing clients and providing website development services. The project is called "JasaWeb" and aims to generate qualified leads for website services (School Websites, News Portals, Company Profiles) while providing a client portal for streamlined collaboration.

The project is structured as an early-stage monorepo with plans for:
- `apps/web` - Astro-based marketing site
- `apps/api` - NestJS API for the client portal
- `packages/ui` / `packages/config` - Shared assets

## Project Goals & KPIs
- Generate qualified leads for 3 main services: School Websites, News Portals, Company Profiles
- Accelerate client collaboration through a Client Portal
- Standardize delivery processes to reduce project cycle time
- Achieve 5-8% conversion from landing page to contact form
- Reduce average project delivery time to 8-10 weeks

## Technical Architecture
- **Frontend**: Next.js 14 (SSR/ISR), Tailwind CSS, shadcn/ui
- **Backend**: Node.js (NestJS) with REST/tRPC API
- **Database**: PostgreSQL (multi-tenant via organization_id)
- **ORM**: Prisma
- **Authentication**: Auth.js/NextAuth with email/Google/Microsoft, 2FA, magic links
- **Storage**: S3-compatible (minIO/Wasabi/AWS)
- **Infrastructure**: Vercel (FE) + Fly.io/Railway (API), Docker, CDN

## Current Status
The project is in early planning stage with detailed documentation in `plan.md` and implementation roadmap in `todo.md`. The codebase is not yet scaffolded according to the planned monorepo structure.

## Key Features (Planned)

### Public Marketing Site
- Landing pages for 3 service types (School, News, Company Profile)
- Portfolio and case studies
- Blog and resources
- Contact forms and meeting booking

### Client Portal
- Project dashboard with milestones and status
- File management & versioning
- Approval workflows with comments
- Ticket system with SLA tracking
- Invoice & payment management
- Reporting and analytics

### Internal Admin/Ops
- Lightweight CRM
- Project management across clients
- Component library and templates

## Building and Running (Planned)

The project will use a pnpm monorepo setup with the following commands once scaffolding is complete:

```bash
# Install dependencies
pnpm install

# Run the Astro marketing site locally
pnpm dev --filter apps/web

# Start the NestJS API with hot reload
pnpm dev --filter apps/api

# Build all workspaces
pnpm build

# Run linting and formatting
pnpm lint && pnpm format

# Run tests (jalankan secara terarah untuk mencegah Vitest mengeksekusi ribuan file dependensi)
pnpm vitest run example.test.ts
```

## Development Conventions

### Coding Style
- Prettier defaults (two-space indent, single quotes in TS/JS)
- Tailwind utility-first styling
- PascalCase for React/Astro components
- camelCase for variables/functions
- SCREAMING_SNAKE_CASE for environment variables

### File Structure
- Components co-located by feature: `apps/web/src/features/<domain>`
- API modules by domain: `apps/api/src/modules/<domain>`
- Environment defaults in `.env.example`
- Never commit real secrets

### Testing
- Vitest for unit tests (`*.test.ts`)
- Playwright for end-to-end tests (`apps/web/tests/e2e`)
- Contract tests for API (`apps/api/tests/contracts`)
- Target ≥80% coverage on critical paths

## Security & Compliance
- OWASP Top 10 compliance
- Rate limiting and strict CORS
- Password hashing with Argon2
- Encryption at rest and in transit
- Multi-tenant data isolation
- Audit logging for critical actions
- Privacy compliance (Indonesian PDP Act)

## MVP Roadmap (10-12 Week Plan)

### Wave 1 - MVP
- Complete public site with CMS
- Basic auth (email/password + magic link) with RBAC & multi-tenancy
- Core modules: Projects, Milestones, Files, Approvals
- Simple tickets (without automatic SLA) and manual invoice uploads
- Dashboard widgets with project status

### Wave 2-3 - Enhancements
- Online payment gateways
- Automated SLA and reporting
- Knowledge Base
- White-label portal and corporate SSO

## Current Implementation Status
The project is currently in the planning phase with detailed specifications in `plan.md` and a TODO list in `todo.md`. The actual codebase has not been scaffolded yet but follows the planned monorepo architecture outlined in `AGENTS.md`.