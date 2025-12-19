# 🔄 Cloudflare Migration Checklist

Dokumen ini adalah **source of truth** untuk AI agents yang akan mengerjakan migrasi ke Cloudflare ecosystem.

## 📍 Current State vs Target State

| Component | CURRENT | TARGET | Priority | Status |
|-----------|---------|--------|----------|--------|
| **Frontend** | Astro + Cloudflare Pages | Astro + Cloudflare Pages | ✅ Done | `COMPLETED` |
| **Backend** | NestJS (Docker) | Cloudflare Workers (via Astro API routes) | 🔴 High | `NOT_STARTED` |
| **Database** | PostgreSQL (Docker) + Prisma | **Prisma + Neon PostgreSQL + Hyperdrive** | 🔴 High | `NOT_STARTED` |
| **Cache** | Redis (Docker) | Cloudflare KV | 🟡 Medium | `NOT_STARTED` |
| **Storage** | AWS S3 / MinIO | Cloudflare R2 | 🟡 Medium | `NOT_STARTED` |
| **Email** | SMTP (Nodemailer) | SMTP via Workers (Resend/Mailchannels) | 🟢 Low | `NOT_STARTED` |

> **Note**: Prisma ORM officially supports Cloudflare Workers via `runtime = "cloudflare"` and driver adapters.
> Reference: https://www.prisma.io/docs/guides/cloudflare-workers

---

## 🎯 Migration Tasks (Ordered by Priority)

### Phase 1: Database Migration (CRITICAL)

#### Task 1.1: Setup Neon PostgreSQL
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to create/modify**:
- None (External setup)

**Steps**:
1. Create Neon account at https://console.neon.tech
2. Create new project named `jasaweb`
3. Copy connection string format: `postgres://user:pass@ep-xxx.region.neon.tech/jasaweb`
4. Document connection string in secure location

**Verification**:
```bash
# Test connection with psql
psql "postgres://user:pass@ep-xxx.region.neon.tech/jasaweb" -c "SELECT 1"
```

---

#### Task 1.2: Migrate Prisma Schema for Cloudflare Workers
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to modify**:
- `apps/api/prisma/schema.prisma` → Move to `apps/web/prisma/schema.prisma`

**Current State**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Target State** (Official Cloudflare Workers config):
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  runtime         = "cloudflare"  // REQUIRED for Workers
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Reference**: https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare

**Verification**:
```bash
cd apps/api
pnpm prisma generate
pnpm prisma migrate deploy
```

---

#### Task 1.3: Setup Cloudflare Hyperdrive
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to create/modify**:
- `apps/web/wrangler.toml`

**Steps**:
1. Create Hyperdrive config:
```bash
wrangler hyperdrive create jasaweb-db --connection-string="DATABASE_URL_FROM_NEON"
```
2. Note the Hyperdrive ID
3. Add to wrangler.toml:
```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "YOUR_HYPERDRIVE_ID"
```

**Verification**:
```bash
wrangler hyperdrive list
# Should show jasaweb-db
```

---

### Phase 2: Cache Migration (Redis → KV)

#### Task 2.1: Create Cloudflare KV Namespaces
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to modify**:
- `apps/web/wrangler.toml`

**Steps**:
```bash
# Production namespace
wrangler kv namespace create "JASAWEB_CACHE"
# Output: id = "xxxxx"

# Preview namespace
wrangler kv namespace create "JASAWEB_CACHE" --preview
# Output: preview_id = "yyyyy"
```

**Add to wrangler.toml**:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "xxxxx"
preview_id = "yyyyy"
```

---

#### Task 2.2: Create KV Cache Service
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to create**:
- `apps/web/src/services/kv-cache.service.ts`

**Target Implementation**:
```typescript
// apps/web/src/services/kv-cache.service.ts

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export class KVCacheService {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json');
      return value as T | null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const kvOptions = options?.ttl
      ? { expirationTtl: options.ttl }
      : undefined;
    await this.kv.put(key, JSON.stringify(value), kvOptions);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.kv.get(key);
    return value !== null;
  }
}

// Factory function for use in Astro API routes
export function createKVCache(env: { CACHE: KVNamespace }): KVCacheService {
  return new KVCacheService(env.CACHE);
}
```

**Verification**:
```bash
pnpm run build:web
# Should compile without errors
```

---

#### Task 2.3: Migrate Existing Cache Usages
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to search**:
```bash
grep -r "redis" apps/ --include="*.ts" --include="*.tsx"
grep -r "cache-manager" apps/ --include="*.ts"
```

**Migration Pattern**:
```typescript
// BEFORE (Redis)
import { CacheService } from './cache.service';
await cacheService.set('key', value, 3600);
const cached = await cacheService.get('key');

// AFTER (Cloudflare KV)
import { createKVCache } from '@/services/kv-cache.service';
const cache = createKVCache(context.locals.runtime.env);
await cache.set('key', value, { ttl: 3600 });
const cached = await cache.get('key');
```

---

### Phase 3: Storage Migration (S3 → R2)

#### Task 3.1: Create Cloudflare R2 Bucket
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to modify**:
- `apps/web/wrangler.toml`

**Steps**:
```bash
# Create R2 bucket
wrangler r2 bucket create jasaweb-storage

# Verify
wrangler r2 bucket list
```

**Add to wrangler.toml**:
```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "jasaweb-storage"
```

---

#### Task 3.2: Create R2 Storage Service
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to create**:
- `apps/web/src/services/r2-storage.service.ts`

**Target Implementation**:
```typescript
// apps/web/src/services/r2-storage.service.ts

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageObject {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
}

export class R2StorageService {
  constructor(private bucket: R2Bucket) {}

  async upload(
    key: string,
    data: ArrayBuffer | ReadableStream | string,
    options?: UploadOptions
  ): Promise<StorageObject> {
    const result = await this.bucket.put(key, data, {
      httpMetadata: options?.contentType
        ? { contentType: options.contentType }
        : undefined,
      customMetadata: options?.metadata,
    });

    if (!result) {
      throw new Error(`Failed to upload ${key}`);
    }

    return {
      key: result.key,
      size: result.size,
      etag: result.etag,
      uploaded: result.uploaded,
    };
  }

  async download(key: string): Promise<ArrayBuffer | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    return await object.arrayBuffer();
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const object = await this.bucket.head(key);
    return object !== null;
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    const listed = await this.bucket.list({ prefix });
    return listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      etag: obj.etag,
      uploaded: obj.uploaded,
    }));
  }

  // Get public URL (requires R2 public access enabled)
  getPublicUrl(key: string, publicDomain: string): string {
    return `https://${publicDomain}/${key}`;
  }
}

// Factory function
export function createR2Storage(env: { STORAGE: R2Bucket }): R2StorageService {
  return new R2StorageService(env.STORAGE);
}
```

---

#### Task 3.3: Migrate Existing Storage Usages
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**Files to modify**:
- `apps/api/src/common/services/dynamic-file-storage.service.ts`
- `apps/api/src/files/file.service.ts`

**Current Implementation Location**:
```
apps/api/src/common/services/dynamic-file-storage.service.ts
```

**Migration Strategy**:
1. R2 adalah S3-compatible, jadi AWS SDK bisa tetap dipakai
2. Ubah endpoint ke R2:
```typescript
// BEFORE
const clientConfig: S3ClientConfig = {
  region: this.region,
};

// AFTER
const clientConfig: S3ClientConfig = {
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
};
```

---

### Phase 4: Backend Migration (NestJS → Workers)

#### Task 4.1: Create Astro API Route Structure
**Status**: `NOT_STARTED`
**Assignee**: AI Agent

**Current Structure** (NestJS):
```
apps/api/src/
├── auth/
├── projects/
├── tasks/
├── users/
└── ...
```

**Target Structure** (Astro API Routes):
```
apps/web/src/pages/api/
├── auth/
│   ├── login.ts
│   ├── register.ts
│   └── refresh.ts
├── projects/
│   ├── index.ts      # GET all, POST create
│   └── [id].ts       # GET one, PUT update, DELETE
├── tasks/
│   ├── index.ts
│   └── [id].ts
└── health.ts
```

**Example API Route**:
```typescript
// apps/web/src/pages/api/health.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;

  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // Check via Hyperdrive
      cache: 'available',    // Check KV
      storage: 'available',  // Check R2
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

### Phase 5: Environment Configuration

#### Task 5.1: Update wrangler.toml
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**File**: `apps/web/wrangler.toml`

**Complete Configuration**:
```toml
name = "jasaweb"
main = "dist/_worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# Account & Zone (optional, for custom domains)
# account_id = "YOUR_ACCOUNT_ID"

# KV Namespaces
[[kv_namespaces]]
binding = "CACHE"
id = "KV_NAMESPACE_ID"
preview_id = "KV_PREVIEW_NAMESPACE_ID"

# R2 Buckets
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "jasaweb-storage"

# Hyperdrive
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "HYPERDRIVE_ID"

# Public Variables
[vars]
NODE_ENV = "production"
SITE_URL = "https://jasaweb.com"
API_BASE_URL = "https://jasaweb.com/api"

# Note: Secrets should be set via:
# wrangler secret put JWT_SECRET
# wrangler secret put JWT_REFRESH_SECRET
# wrangler secret put DATABASE_URL
```

---

#### Task 5.2: Create Cloudflare Types
**Status**: `NOT_STARTED`
**Assignee**: AI Agent
**File to create**: `apps/web/src/env.d.ts`

**Add/Update**:
```typescript
/// <reference types="astro/client" />

interface CloudflareEnv {
  // KV Namespaces
  CACHE: KVNamespace;

  // R2 Buckets
  STORAGE: R2Bucket;

  // Hyperdrive
  HYPERDRIVE: Hyperdrive;

  // Environment Variables
  NODE_ENV: string;
  SITE_URL: string;
  API_BASE_URL: string;

  // Secrets
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  DATABASE_URL: string;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: CloudflareEnv;
      ctx: ExecutionContext;
      cf: CfProperties;
    };
  }
}
```

---

## ✅ Verification Checklist

Sebelum deployment, pastikan semua item ini verified:

### Infrastructure
- [ ] Neon PostgreSQL project created
- [ ] Database schema migrated (`pnpm prisma migrate deploy`)
- [ ] Cloudflare Hyperdrive configured
- [ ] Cloudflare KV namespaces created (prod + preview)
- [ ] Cloudflare R2 bucket created
- [ ] All secrets set via `wrangler secret put`

### Code
- [ ] KV Cache Service created and tested
- [ ] R2 Storage Service created and tested
- [ ] API routes migrated from NestJS to Astro
- [ ] All Redis usages replaced with KV
- [ ] All S3 usages updated with R2 endpoint
- [ ] TypeScript types updated for Cloudflare env

### Build & Deploy
- [ ] `pnpm run build:web` succeeds
- [ ] `wrangler pages deploy dist` succeeds
- [ ] Health endpoint returns 200
- [ ] API endpoints functional
- [ ] Database queries working via Hyperdrive

---

## 🚨 Known Issues & Blockers

| Issue | Impact | Workaround | Status |
|-------|--------|------------|--------|
| NestJS not compatible with Workers | CRITICAL | Migrate to Astro API routes | `NOT_STARTED` |
| Prisma requires driver adapters for edge | HIGH | Add `previewFeatures = ["driverAdapters"]` | `NOT_STARTED` |
| Redis package not available in Workers | HIGH | Use Cloudflare KV | `NOT_STARTED` |

---

## 📝 Notes for AI Agents

1. **Always verify** before marking task complete
2. **Run tests** after each change: `pnpm test`
3. **Run build** to check compilation: `pnpm run build`
4. **Check Workers compatibility** - avoid Node.js-specific APIs:
   - ❌ `fs`, `path`, `child_process`
   - ❌ `net`, `dns`, `os`
   - ✅ `fetch`, `crypto` (Web Crypto API)
   - ✅ `TextEncoder`, `TextDecoder`
5. **Commit after each phase** with conventional commits
6. **Update this document** when completing tasks
