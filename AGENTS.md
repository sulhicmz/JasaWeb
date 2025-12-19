# JasaWeb - AI Agent Guidelines

## 🚨 STATUS: MIGRASI KE CLOUDFLARE

Project sedang migrasi. Lihat `task.md` untuk progress.

---

## Tech Stack (Target)

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Astro + React |
| Backend | Cloudflare Workers (Astro API Routes) |
| Database | Neon PostgreSQL + Prisma ORM + Hyperdrive |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 |
| Deployment | Cloudflare Pages |

---

## File Penting

| File | Fungsi |
|------|--------|
| `task.md` | Daftar task untuk dikerjakan |
| `bug.md` | Daftar bug untuk diperbaiki |
| `evaluasi.md` | Hasil evaluasi codebase |
| `docs/deployment/SETUP.md` | Panduan setup Cloudflare |

---

## Struktur Direktori

```
apps/
├── web/                    # AKTIF - Astro + Workers
│   ├── src/
│   │   ├── pages/api/      # API endpoints
│   │   ├── lib/prisma.ts   # Database client
│   │   └── services/       # KV, R2 services
│   ├── prisma/             # Database schema
│   └── wrangler.toml       # Cloudflare config
└── api/                    # DEPRECATED - Jangan modify
```

---

## Aturan untuk AI Agents

### ✅ DO
- Baca `task.md` sebelum mulai
- Update `task.md` setelah selesai task
- Commit dengan Conventional Commits: `feat:`, `fix:`, `docs:`
- Test sebelum commit: `pnpm build`
- Buat PR ke branch `dev`

### ❌ DON'T
- Jangan modify `apps/api/` (deprecated)
- Jangan pakai Node.js APIs (fs, path) di Workers
- Jangan hardcode secrets
- Jangan skip testing

---

## Conventional Commits

```
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
refactor(scope): code refactoring
test(scope): add tests
ci(scope): update workflows
```

---

## Quick Commands

```bash
pnpm install          # Install deps
pnpm build            # Build all
pnpm test             # Run tests
pnpm lint             # Check linting
pnpm prisma generate  # Generate Prisma client
```

---

**Branch utama**: `dev`
**Deployment**: Cloudflare Pages
