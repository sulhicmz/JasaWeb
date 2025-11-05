# JasaWeb - Agent Development Guide

## Commands
```bash
# Development
pnpm dev                    # Start both web (Astro) + API (NestJS)
pnpm dev:web               # Astro frontend only
pnpm dev:api               # NestJS API only

# Testing
pnpm test                  # Vitest unit tests
pnpm test:run              # Run tests once
pnpm test:run example.test.ts  # Run single test file
pnpm test:e2e              # Playwright E2E tests
pnpm test:api              # API tests (Jest)

# Code Quality
pnpm lint && pnpm format   # Lint and format code
pnpm typecheck             # TypeScript validation
pnpm build                 # Build all workspaces

# Database (API)
pnpm db:migrate            # Prisma migrations
pnpm db:generate           # Generate Prisma client
pnpm db:studio             # Open Prisma Studio
```

## Code Style
- **Formatting**: Prettier with single quotes, 2-space indent, semicolons
- **Components**: PascalCase (Header.astro, Button.tsx)
- **Variables/Functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Imports**: Group external libs first, then internal modules
- **Error Handling**: Use NestJS exceptions (BadRequestException, UnauthorizedException)
- **Types**: Strict TypeScript, explicit return types for public APIs

## Architecture
- **Frontend**: Astro + React + Tailwind in `apps/web`
- **Backend**: NestJS + Prisma + PostgreSQL in `apps/api`
- **Database**: Multi-tenant via organization_id
- **Auth**: JWT with refresh tokens, bcrypt for passwords
- **File Structure**: Feature-based organization, co-located components

## Testing Strategy
- Unit tests: `*.test.ts` with Vitest
- API tests: `*.spec.ts` with Jest in apps/api
- E2E tests: Playwright in apps/web/tests/e2e
- Target 80%+ coverage on critical paths