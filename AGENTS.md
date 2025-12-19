# JasaWeb - AI Agent Guidelines

## Project Overview

JasaWeb adalah platform web development service dengan client portal. Project ini sedang dalam proses **migrasi ke Cloudflare ecosystem**.

### Current Architecture (Legacy)
```
apps/web    → Astro (Cloudflare Pages) ✅
apps/api    → NestJS (Docker) ❌ DEPRECATED
```

### Target Architecture (Cloudflare Ecosystem)
```
apps/web    → Astro + Cloudflare Pages + Workers
            → Database: Prisma + Neon PostgreSQL + Hyperdrive
            → Cache: Cloudflare KV
            → Storage: Cloudflare R2
```

---

## 🚨 CRITICAL: Migration Status

**BACA DULU**: `docs/deployment/migration-checklist.md`

Project sedang migrasi dari:
- ❌ NestJS → ✅ Astro API Routes (Cloudflare Workers)
- ❌ PostgreSQL (Docker) → ✅ Neon PostgreSQL + Hyperdrive
- ❌ Redis → ✅ Cloudflare KV
- ❌ AWS S3/MinIO → ✅ Cloudflare R2

---

## Tech Stack (Target)

| Component | Technology | Notes |
|-----------|------------|-------|
| **Frontend** | Astro + React | Deploy ke Cloudflare Pages |
| **Backend** | Cloudflare Workers | Via Astro SSR API routes |
| **Database** | Prisma + Neon PostgreSQL | Dengan Cloudflare Hyperdrive |
| **Cache** | Cloudflare KV | Bukan Redis |
| **Storage** | Cloudflare R2 | S3-compatible |
| **Package Manager** | pnpm 8.15.0 | Monorepo workspaces |
| **Testing** | Vitest | Unit + integration tests |

---

## Development Conventions

### Coding Style
- **Indent**: 2 spaces (Prettier default)
- **Quotes**: Single quotes in TS/JS
- **Components**: PascalCase
- **Variables/Functions**: camelCase
- **Environment Variables**: SCREAMING_SNAKE_CASE
- **File Names**: kebab-case

### Commit Style (MANDATORY)
**Conventional Commits** format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `ci`: CI/CD changes
- `chore`: Maintenance

Examples:
```bash
feat(auth): implement JWT refresh token rotation
fix(storage): handle R2 upload timeout errors
docs(migration): update cloudflare setup guide
refactor(cache): migrate redis to cloudflare kv
```

### Branch Naming
```
feature/short-description
fix/issue-123-description
refactor/module-name
docs/topic-name
```

---

## File Structure

```
jasaweb/
├── apps/
│   ├── web/                    # Main application (Astro + Workers)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── api/        # API Routes (Workers)
│   │   │   │   └── ...         # Page routes
│   │   │   ├── components/     # UI components
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── kv-cache.service.ts
│   │   │   │   └── r2-storage.service.ts
│   │   │   └── types/          # TypeScript types
│   │   ├── wrangler.toml       # Cloudflare config
│   │   └── astro.config.mjs
│   └── api/                    # ❌ DEPRECATED - DO NOT MODIFY
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── config/                 # Shared configurations
│   └── testing/                # Testing utilities
├── docs/
│   └── deployment/
│       ├── cloudflare-ecosystem.md    # Setup guide
│       └── migration-checklist.md     # Task tracking
└── .github/workflows/          # CI/CD
```

---

## API Development Pattern

### Astro API Route Template
```typescript
// apps/web/src/pages/api/[resource]/index.ts
import type { APIRoute } from 'astro';
import { createKVCache } from '@/services/kv-cache.service';
import { createR2Storage } from '@/services/r2-storage.service';

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime.env;
  const cache = createKVCache(env);
  const storage = createR2Storage(env);

  try {
    // Your logic here
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  // Similar pattern
};
```

### Service Pattern
```typescript
// Singleton-like factory pattern for Workers
export function createService(env: CloudflareEnv) {
  return new ServiceClass(env);
}
```

---

## Testing Guidelines

### Running Tests
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

### Test File Naming
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ServiceName', () => {
  let service: ServiceClass;

  beforeEach(() => {
    service = new ServiceClass(mockEnv);
  });

  describe('methodName', () => {
    it('should do expected behavior', async () => {
      const result = await service.methodName();
      expect(result).toBeDefined();
    });
  });
});
```

---

## Security Requirements

### OWASP Compliance
- ✅ Input validation on all endpoints
- ✅ Parameterized queries (Prisma handles this)
- ✅ JWT with short expiry + refresh tokens
- ✅ Rate limiting per IP
- ✅ CORS configured for allowed origins only
- ✅ No secrets in code (use Cloudflare Secrets)

### Sensitive Data Handling
```typescript
// ❌ NEVER
const secret = "hardcoded-secret";

// ✅ ALWAYS
const secret = env.JWT_SECRET;
```

### Workers-Specific Security
- Semua secrets via `wrangler secret put`
- Tidak ada akses filesystem (gunakan R2)
- Tidak ada child_process (sandbox environment)

---

## Warnings & Gotchas

### ⚠️ apps/api is DEPRECATED
- **DO NOT** add new features ke `apps/api`
- **DO NOT** fix bugs di `apps/api` (kecuali critical)
- **MIGRATE** functionality ke `apps/web/src/pages/api/`

### ⚠️ Workers Runtime Limitations
Node.js APIs yang **TIDAK TERSEDIA** di Workers:
- `fs`, `path` (gunakan R2)
- `child_process`, `cluster`
- `net`, `dns`, `dgram`
- `os`, `v8`

Node.js APIs yang **TERSEDIA** (dengan compatibility flag):
- `crypto` (via Web Crypto API)
- `Buffer` (via nodejs_compat)
- `TextEncoder`, `TextDecoder`
- `fetch`, `Request`, `Response`

### ⚠️ Database Connections
- **HARUS** gunakan Hyperdrive untuk connection pooling
- Prisma di edge **HARUS** pakai `previewFeatures = ["driverAdapters"]`
- Connection string **HARUS** dari `env.HYPERDRIVE.connectionString`

---

## Quick Reference Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm dev:web          # Web only (includes API routes)

# Build
pnpm build            # Build all
pnpm build:web        # Web only

# Testing
pnpm test             # Run tests
pnpm lint             # Lint check
pnpm typecheck        # TypeScript check

# Database
pnpm prisma generate  # Generate client
pnpm prisma migrate   # Run migrations

# Cloudflare
wrangler login        # Auth
wrangler pages deploy # Deploy
wrangler tail         # View logs
wrangler secret put   # Set secrets
```

---

## Required Reading Before Starting

1. **Migration Checklist**: `docs/deployment/migration-checklist.md`
2. **Cloudflare Setup**: `docs/deployment/cloudflare-ecosystem.md`
3. **Current Tasks**: `todo.md`
4. **Architecture**: `docs/blueprint.md`
5. **Roadmap**: `docs/roadmap.md`

---

## Contact & Escalation

- **Repository**: github.com/sulhicmz/JasaWeb
- **Branch untuk development**: `dev`
- **Branch untuk production**: `main`
