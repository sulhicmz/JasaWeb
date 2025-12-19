# Cloudflare Setup Guide

## Akun yang Diperlukan

| Akun | URL | Free Tier |
|------|-----|-----------|
| **Cloudflare** | [dash.cloudflare.com](https://dash.cloudflare.com) | Pages, Workers, KV, R2 |
| **Neon** | [console.neon.tech](https://console.neon.tech) | 3GB PostgreSQL |
| **Midtrans** | [dashboard.midtrans.com](https://dashboard.midtrans.com) | Sandbox gratis |

---

## Step 1: Cloudflare Account

```bash
pnpm add -g wrangler
wrangler login
wrangler whoami
```

---

## Step 2: Neon Database

1. Buat project di Neon Dashboard
2. Copy connection string
3. Setup Hyperdrive:

```bash
wrangler hyperdrive create jasaweb-db --connection-string="CONNECTION_STRING"
```

---

## Step 3: Cloudflare KV

```bash
wrangler kv namespace create "CACHE"
# Catat ID
```

---

## Step 4: Cloudflare R2

```bash
wrangler r2 bucket create jasaweb-storage
```

---

## Step 5: wrangler.toml

```toml
name = "jasaweb"
main = "dist/_worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "HYPERDRIVE_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "KV_ID"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "jasaweb-storage"

[vars]
NODE_ENV = "production"
```

---

## Step 6: Secrets

```bash
wrangler secret put JWT_SECRET
wrangler secret put MIDTRANS_SERVER_KEY
wrangler secret put MIDTRANS_CLIENT_KEY
```

---

## Step 7: Deploy

```bash
cd apps/web
pnpm build
wrangler pages deploy dist
```

---

## Prisma Configuration

### schema.prisma

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  runtime         = "cloudflare"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Prisma Client Factory

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function createPrismaClient(env: CloudflareEnv) {
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
```

---

## Biaya Bulanan

| Service | Biaya |
|---------|-------|
| Cloudflare | Gratis |
| Neon | Gratis (3GB) |
| Midtrans | 2.9%/transaksi |
| **Total Fixed** | **Rp 0** |
