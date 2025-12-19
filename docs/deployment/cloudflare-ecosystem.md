# ☁️ Cloudflare Deployment Guide

Panduan komprehensif untuk deploy JasaWeb ke ekosistem Cloudflare dengan free tier.

## 📋 Overview

JasaWeb menggunakan full Cloudflare ecosystem untuk deployment yang mudah dan scalable:

| Component | Cloudflare Service | Free Tier Limit |
|-----------|-------------------|-----------------|
| **Frontend** | Cloudflare Pages | Unlimited sites, 500 builds/month |
| **Backend** | Cloudflare Workers | 100K requests/day |
| **Database** | Neon/Prisma Postgres + Hyperdrive | 3GB (Neon) / 100K req/mo (Prisma) |
| **Cache** | Cloudflare KV | 100K reads/day, 1K writes/day |
| **Storage** | Cloudflare R2 | 10GB storage, 10M reads/month |
| **DNS** | Cloudflare DNS | Unlimited |

## 🚀 Quick Start

### Prerequisites

1. **Cloudflare Account** - [Sign up gratis](https://dash.cloudflare.com/sign-up)
2. **Neon Account** atau **Prisma Postgres** - [Neon](https://neon.tech) / [Prisma](https://console.prisma.io)
3. **Node.js 20+** dan **pnpm**
4. **Wrangler CLI** - `pnpm add -g wrangler`

### Step 1: Setup Cloudflare Account

```bash
# Login ke Cloudflare
wrangler login

# Verifikasi login
wrangler whoami
```

### Step 2: Setup Database (Pilih Salah Satu)

#### Option A: Neon (PostgreSQL Serverless)

1. Buat project di [Neon Dashboard](https://console.neon.tech)
2. Copy connection string
3. Setup Hyperdrive untuk caching:

```bash
# Buat Hyperdrive config
wrangler hyperdrive create jasaweb-db --connection-string="postgres://user:pass@host/db"

# Catat ID yang dihasilkan
```

#### Option B: Prisma Postgres

1. Buat database di [Prisma Console](https://console.prisma.io)
2. Copy connection string (sudah include Accelerate)
3. Update `DATABASE_URL` di environment

### Step 3: Setup Cloudflare KV (Cache)

```bash
# Buat KV namespace untuk production
wrangler kv namespace create "JASAWEB_CACHE"

# Buat KV namespace untuk preview/staging
wrangler kv namespace create "JASAWEB_CACHE" --preview

# Catat ID namespace yang dihasilkan
```

Output akan seperti:
```
🌀 Creating namespace with title "jasaweb-JASAWEB_CACHE"
✨ Success! Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "JASAWEB_CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Step 4: Setup Cloudflare R2 (Storage)

```bash
# Buat R2 bucket
wrangler r2 bucket create jasaweb-storage

# Verifikasi
wrangler r2 bucket list
```

### Step 5: Configure wrangler.toml

Buat/update `apps/web/wrangler.toml`:

```toml
name = "jasaweb-web"
main = "dist/_worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# KV Namespaces
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_ID"

# R2 Buckets
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "jasaweb-storage"

# Hyperdrive (jika pakai Neon)
[[hyperdrive]]
binding = "DB"
id = "YOUR_HYPERDRIVE_ID"

# Environment Variables
[vars]
NODE_ENV = "production"
SITE_URL = "https://jasaweb.com"

# Secrets (set via wrangler secret)
# JWT_SECRET, DATABASE_URL, etc.
```

### Step 6: Set Secrets

```bash
# Set production secrets
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put DATABASE_URL
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
```

### Step 7: Deploy

```bash
# Build dan deploy
cd apps/web
pnpm run cf-build
wrangler pages deploy dist
```

## 📁 Project Structure untuk Cloudflare

```
apps/web/
├── src/
│   ├── pages/
│   │   └── api/           # API routes (Cloudflare Workers)
│   ├── services/
│   │   ├── kvCache.ts     # Cloudflare KV wrapper
│   │   └── r2Storage.ts   # Cloudflare R2 wrapper
│   └── ...
├── wrangler.toml          # Cloudflare config
├── astro.config.mjs       # Astro + Cloudflare adapter
└── package.json
```

## 🔧 Service Configurations

### Cloudflare KV Cache Service

```typescript
// src/services/kvCache.ts
export class KVCacheService {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const options = ttl ? { expirationTtl: ttl } : undefined;
    await this.kv.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
```

### Cloudflare R2 Storage Service

```typescript
// src/services/r2Storage.ts
export class R2StorageService {
  constructor(private bucket: R2Bucket) {}

  async upload(key: string, data: ArrayBuffer, contentType: string): Promise<R2Object> {
    return await this.bucket.put(key, data, {
      httpMetadata: { contentType },
    });
  }

  async download(key: string): Promise<R2ObjectBody | null> {
    return await this.bucket.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async getSignedUrl(key: string): Promise<string> {
    // R2 presigned URLs untuk akses temporary
    const object = await this.bucket.get(key);
    if (!object) throw new Error('Object not found');

    // Return public URL jika bucket public
    return `https://YOUR_R2_PUBLIC_URL/${key}`;
  }
}
```

### Database dengan Hyperdrive

```typescript
// src/services/database.ts
import { PrismaClient } from '@prisma/client';

export function createPrismaClient(env: Env) {
  // Gunakan Hyperdrive connection string untuk performance
  const connectionString = env.DB?.connectionString || env.DATABASE_URL;

  return new PrismaClient({
    datasources: {
      db: { url: connectionString },
    },
  });
}
```

## 🌐 CI/CD dengan GitHub Actions

### Automated Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main, dev]

jobs:
  deploy:
    runs-on: ubuntu-24.04-arm
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 8.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build:web
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: jasaweb
          directory: apps/web/dist
          branch: ${{ github.ref_name }}
```

## 🔒 Environment Variables

### Required Secrets (via Cloudflare Dashboard atau wrangler)

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `DATABASE_URL` | Neon/Prisma connection string | Secret |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Secret |
| `JWT_REFRESH_SECRET` | Refresh token secret | Secret |
| `SMTP_USER` | Email service user | Secret |
| `SMTP_PASS` | Email service password | Secret |

### Public Variables (via wrangler.toml)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `SITE_URL` | Site base URL | `https://jasaweb.com` |
| `API_BASE_URL` | API endpoint | `https://jasaweb.com/api` |

## 📊 Monitoring & Observability

### Cloudflare Analytics (Built-in)

- **Workers Analytics**: Request count, CPU time, errors
- **Pages Analytics**: Page views, visitors, bandwidth
- **R2 Metrics**: Storage usage, request count

### Logs

```bash
# Real-time logs
wrangler tail

# Filtered logs
wrangler tail --status error
```

## 🔄 Migration dari Stack Lama

### Dari Redis ke Cloudflare KV

```typescript
// Before (Redis)
await redis.set('key', value, 'EX', 3600);
const cached = await redis.get('key');

// After (Cloudflare KV)
await env.CACHE.put('key', JSON.stringify(value), { expirationTtl: 3600 });
const cached = await env.CACHE.get('key');
```

### Dari AWS S3 ke Cloudflare R2

```typescript
// Before (AWS S3)
await s3.putObject({ Bucket: 'bucket', Key: 'key', Body: data });

// After (Cloudflare R2) - S3 Compatible!
await env.STORAGE.put('key', data);
```

**Note**: R2 adalah S3-compatible, jadi library `@aws-sdk/client-s3` bisa tetap digunakan dengan endpoint R2.

### Dari PostgreSQL ke Neon + Hyperdrive

1. Export data dari PostgreSQL lama
2. Import ke Neon
3. Update `DATABASE_URL` dengan Neon connection string
4. Setup Hyperdrive untuk caching

```bash
# Export dari PostgreSQL lama
pg_dump -h old-host -U user -d jasaweb > jasaweb.sql

# Import ke Neon
psql "postgres://user:pass@neon-host/jasaweb" < jasaweb.sql
```

## 💰 Cost Estimation (Free Tier)

| Service | Free Tier | Typical Small App Usage |
|---------|-----------|------------------------|
| **Pages** | 500 builds/mo | ~30 builds/mo |
| **Workers** | 100K req/day | ~10K req/day |
| **KV** | 100K reads/day | ~5K reads/day |
| **R2** | 10GB, 10M reads/mo | ~1GB, 100K reads/mo |
| **Neon** | 3GB storage | ~500MB |

**Estimasi**: Aplikasi skala kecil-menengah bisa berjalan **100% gratis**.

## 🆘 Troubleshooting

### Common Issues

#### 1. KV Read Limits

```
Error: KV read limit exceeded
```

**Solusi**: Tingkatkan TTL cache atau upgrade plan.

#### 2. Database Connection Timeout

```
Error: Connection timeout
```

**Solusi**:
- Pastikan Hyperdrive dikonfigurasi
- Periksa connection string

#### 3. Build Failed on Pages

```
Error: Build failed
```

**Solusi**:
```bash
# Test build locally
pnpm run cf-build

# Check logs
wrangler pages deployment list
```

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [Neon Docs](https://neon.tech/docs)
- [Prisma with Cloudflare](https://www.prisma.io/docs/guides/deployment/edge/deploy-to-cloudflare)
