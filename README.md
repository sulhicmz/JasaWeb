# 🌐 JasaWeb

Platform jasa pembuatan website (Sekolah, Berita, Company Profile) dengan client portal.

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Astro + React |
| Backend | Cloudflare Workers |
| Database | Neon PostgreSQL + Prisma |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 |
| Payment | Midtrans QRIS |
| Hosting | Cloudflare Pages |

---

## Features

### Public Site
- Landing page
- Template gallery
- Pricing
- Blog
- Register & Login

### Client Portal
- Dashboard
- Web Saya (projects list)
- Billing (QRIS payment)
- Akun Saya

### Admin Panel
- Manage clients
- Manage projects
- Manage blog
- Manage pages
- Manage templates

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8.15+
- Cloudflare account
- Neon account

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Deploy

```bash
cd apps/web
wrangler pages deploy dist
```

---

## Project Structure

```
jasaweb/
├── apps/
│   └── web/                # Astro + Cloudflare Workers
│       ├── src/
│       │   ├── pages/      # Astro pages
│       │   │   └── api/    # API endpoints
│       │   ├── components/ # React components
│       │   ├── lib/        # Utilities
│       │   └── services/   # Business logic
│       ├── prisma/         # Database schema
│       └── wrangler.toml   # Cloudflare config
├── packages/
│   ├── ui/                 # Shared components
│   └── config/             # Shared config
├── docs/
│   ├── architecture/       # Blueprint & roadmap
│   └── deployment/         # Setup guide
├── AGENTS.md               # AI agent guidelines
├── task.md                 # Task checklist
└── bug.md                  # Bug tracker
```

---

## Documentation

| Doc | Deskripsi |
|-----|-----------|
| [AGENTS.md](AGENTS.md) | Guidelines untuk AI agents |
| [task.md](task.md) | Task checklist |
| [Blueprint](docs/architecture/blueprint.md) | Spesifikasi fitur |
| [Setup Guide](docs/deployment/SETUP.md) | Panduan setup Cloudflare |

---

## Roles

| Role | Akses |
|------|-------|
| **Admin** | Full access |
| **Client** | Portal only |

---

## License

MIT
