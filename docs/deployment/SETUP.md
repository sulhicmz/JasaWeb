# Cloudflare Setup Guide

## Required Accounts

| Account | URL | Free Tier |
|---------|-----|-----------|
| **Cloudflare** | [dash.cloudflare.com](https://dash.cloudflare.com) | Pages, Workers, KV, R2 |
| **Neon** | [console.neon.tech](https://console.neon.tech) | 3GB PostgreSQL |
| **Midtrans** | [dashboard.midtrans.com](https://dashboard.midtrans.com) | Free sandbox |

---

## Step 1: Cloudflare Account

```bash
pnpm add -g wrangler
wrangler login
wrangler whoami
```

---

## Step 2: Neon Database

1. Create a project in Neon Dashboard
2. Copy the connection string
3. Setup Hyperdrive:

```bash
wrangler hyperdrive create jasaweb-db --connection-string="CONNECTION_STRING"
```

---

## Step 3: Cloudflare KV

```bash
wrangler kv namespace create "CACHE"
# Note down the ID
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
pnpm build
wrangler pages deploy dist
```

---

## Environment Variables Setup

### Local Development (`.dev.vars`)

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/jasaweb
JWT_SECRET=your-local-secret-key
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
```

### Production (Cloudflare Secrets)

```bash
# Set production secrets
wrangler secret put JWT_SECRET
wrangler secret put MIDTRANS_SERVER_KEY
wrangler secret put MIDTRANS_CLIENT_KEY
wrangler secret put DATABASE_URL

# Verify secrets are set
wrangler secret list
```

---

## Troubleshooting

### Common Issues

#### 1. Prisma Client Generation Failed

**Error**: `Error: P1001: Can't reach database server`

**Solution**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Regenerate client
pnpm db:generate
```

#### 2. Cloudflare Workers Build Error

**Error**: `TypeError: Buffer is not defined`

**Solution**: Ensure `nodejs_compat` flag is set in `wrangler.toml`:
```toml
compatibility_flags = ["nodejs_compat"]
```

#### 3. Environment Variables Not Available in Workers

**Error**: `RuntimeError: Access denied to environment variable`

**Solution**:
- Verify secrets are set with `wrangler secret put`
- Access secrets via `locals.runtime.env`, not `import.meta.env`
- Check bindings are defined in `wrangler.toml`

#### 4. KV Namespace Not Found

**Error**: `RuntimeError: KV namespace not found`

**Solution**:
```bash
# List KV namespaces
wrangler kv:namespace list

# Create if missing
wrangler kv:namespace create "CACHE"

# Update wrangler.toml with correct ID
```

#### 5. R2 Bucket Access Error

**Error**: `RuntimeError: R2 bucket not found`

**Solution**:
```bash
# List R2 buckets
wrangler r2 bucket list

# Create if missing
wrangler r2 bucket create jasaweb-storage

# Verify binding in wrangler.toml
```

#### 6. Midtrans Payment Failed

**Error**: `Error: Invalid Midtrans Server Key`

**Solution**:
- Ensure using production server key (not sandbox) for production
- Verify secret is set: `wrangler secret list`
- Check key format: `SB-Mid-server-...` (sandbox) or `Mid-server-...` (production)

#### 7. Build Timeout

**Error**: `Error: Build timeout exceeded`

**Solution**:
- Increase timeout in `wrangler.toml`:
```toml
[build]
command = "pnpm build"
cwd = "."
watch_dir = "src"
timeout = 1800  # 30 minutes
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Database URL configured (production Neon PostgreSQL)
- [ ] All secrets set via `wrangler secret put`
- [ ] KV namespace created and bound
- [ ] R2 bucket created and bound
- [ ] Hyperdrive configured for connection pooling
- [ ] Prisma schema migrated: `pnpm db:migrate`
- [ ] Tests passing: `pnpm test`
- [ ] Type checking passing: `pnpm typecheck`
- [ ] Build successful: `pnpm build`
- [ ] Production Midtrans credentials configured

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: jasaweb
          directory: dist
```

---

## Monitoring

### View Logs

```bash
# Real-time logs
wrangler pages deployment tail

# Specific deployment
wrangler pages deployment list
wrangler pages deployment tail <deployment-id>
```

### Performance Metrics

Access admin dashboard performance monitoring:
- Bundle size: `/dashboard/admin/performance`
- API performance: `/api/admin/performance`
- Cache health: `/api/admin/cache`
- Intelligence analytics: `/api/admin/performance-intelligence`

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

## Monthly Costs

| Service | Cost |
|---------|------|
| Cloudflare | Free |
| Neon | Free (3GB) |
| Midtrans | 2.9% per transaction |
| **Total Fixed** | **Rp 0** |
