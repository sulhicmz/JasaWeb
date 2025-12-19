# 🚀 Cloudflare Deployment Guide

Dokumentasi untuk deploy dan migrasi JasaWeb ke Cloudflare.

## 📋 Akun yang Diperlukan

| Akun | URL | Free Tier |
|------|-----|-----------|
| **Cloudflare** | [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) | ✅ Pages, Workers, KV, R2, Hyperdrive |
| **Neon** | [console.neon.tech](https://console.neon.tech) | ✅ 3GB PostgreSQL |

**Total: 2 akun**

> **Catatan**: Prisma adalah library kode (npm package), bukan layanan. Tidak perlu akun Prisma.

---

## 🏗️ Tech Stack

| Komponen | Teknologi | Layanan |
|----------|-----------|---------|
| Frontend | Astro + React | Cloudflare Pages |
| Backend | Astro API Routes | Cloudflare Workers |
| Database | PostgreSQL + Prisma ORM | Neon + Hyperdrive |
| Cache | Key-Value Store | Cloudflare KV |
| Storage | Object Storage | Cloudflare R2 |

---

## 📦 Setup Langkah demi Langkah

### 1. Setup Cloudflare

```bash
# Install Wrangler CLI
pnpm add -g wrangler

# Login
wrangler login

# Verifikasi
wrangler whoami
```

### 2. Setup Neon Database

1. Buka [console.neon.tech](https://console.neon.tech)
2. Klik "Create Project"
3. Nama: `jasaweb`
4. Region: Pilih terdekat (Singapore/Tokyo)
5. Copy **Connection String**

Format: `postgres://user:pass@ep-xxx-xxx.region.aws.neon.tech/jasaweb`

### 3. Setup Cloudflare Hyperdrive

```bash
# Buat Hyperdrive config (ganti CONNECTION_STRING)
wrangler hyperdrive create jasaweb-db \
  --connection-string="postgres://user:pass@ep-xxx.neon.tech/jasaweb"

# Output akan menampilkan ID, catat ini
```

### 4. Setup Cloudflare KV

```bash
# Buat KV namespace
wrangler kv namespace create "CACHE"

# Catat ID yang dihasilkan
```

### 5. Setup Cloudflare R2

```bash
# Buat R2 bucket
wrangler r2 bucket create jasaweb-storage
```

### 6. Konfigurasi wrangler.toml

Buat file `apps/web/wrangler.toml`:

```toml
name = "jasaweb"
main = "dist/_worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# Database
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "HYPERDRIVE_ID_DARI_STEP_3"

# Cache
[[kv_namespaces]]
binding = "CACHE"
id = "KV_ID_DARI_STEP_4"

# Storage
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "jasaweb-storage"

# Environment
[vars]
NODE_ENV = "production"
SITE_URL = "https://jasaweb.com"
```

### 7. Set Secrets

```bash
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put DATABASE_URL
```

### 8. Deploy

```bash
cd apps/web
pnpm run build
wrangler pages deploy dist
```

---

## 🔧 Prisma Configuration

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

### Prisma Client di Workers

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function createPrismaClient(env: CloudflareEnv) {
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
```

**Penting**: Buat PrismaClient baru di setiap request (tidak ada singleton).

---

## 📁 Struktur File Target

```
apps/web/
├── src/
│   ├── pages/
│   │   └── api/           # API endpoints (Workers)
│   ├── lib/
│   │   └── prisma.ts      # Prisma client factory
│   └── services/
│       ├── cache.ts       # KV wrapper
│       └── storage.ts     # R2 wrapper
├── prisma/
│   └── schema.prisma      # Database schema
├── wrangler.toml          # Cloudflare config
└── astro.config.mjs
```

---

## ✅ Verifikasi

Setelah deploy, pastikan:

- [ ] `https://jasaweb.com` accessible
- [ ] `https://jasaweb.com/api/health` returns 200
- [ ] Database queries berfungsi
- [ ] File upload ke R2 berfungsi

---

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Cek Hyperdrive
wrangler hyperdrive list

# Cek connection string
wrangler hyperdrive get jasaweb-db
```

### Build Error
```bash
# Test build locally
pnpm run build

# Cek logs
wrangler pages deployment list
```

### View Logs
```bash
wrangler tail
```

---

## 📚 Referensi

- [Prisma + Cloudflare Workers](https://www.prisma.io/docs/guides/cloudflare-workers)
- [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [Neon Documentation](https://neon.tech/docs)
