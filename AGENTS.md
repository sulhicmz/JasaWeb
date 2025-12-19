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

## ⛔ PROHIBITED ACTIONS

AI Agents **DILARANG KERAS** melakukan:

1. **Membuat file dokumentasi baru** tanpa instruksi eksplisit dari user
2. **Menambah dependencies baru** ke package.json tanpa approval
3. **Mengubah tech stack** dari yang sudah ditetapkan (Cloudflare/Neon/Prisma)
4. **Modify `apps/api/`** - folder ini DEPRECATED
5. **Menggunakan Node.js APIs** yang tidak tersedia di Workers (fs, path, child_process)
6. **Hardcode secrets** - semua secrets harus via environment variables
7. **Skip testing** - selalu run `pnpm build` sebelum commit
8. **Membuat integrasi baru** dengan service eksternal tanpa approval

---

## ✅ ALLOWED ACTIONS

AI Agents **BOLEH** melakukan:

1. Mengerjakan task dari `task.md`
2. Fix bugs yang tertulis di `bug.md`
3. Update dokumentasi **yang sudah ada**
4. Refactor code dalam scope task yang diberikan
5. Commit dengan Conventional Commits

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
