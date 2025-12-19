# JasaWeb - AI Agent Guidelines

## 🎯 Project Overview

Platform jasa pembuatan website dengan client portal.

**Scope**: Marketing site + Client portal + Admin panel + Midtrans payment

---

## Tech Stack (FINAL - JANGAN DIUBAH)

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Astro + React |
| Backend | Cloudflare Workers (Astro API Routes) |
| Database | Neon PostgreSQL + Prisma ORM |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 |
| Payment | Midtrans (QRIS) |
| Hosting | Cloudflare Pages |

---

## 📁 File Referensi

| File | Fungsi |
|------|--------|
| `docs/architecture/blueprint.md` | Spesifikasi fitur & database schema |
| `docs/deployment/SETUP.md` | Panduan setup Cloudflare |
| `task.md` | Checklist task |
| `bug.md` | Bug tracker |

---

## 🏗️ Struktur Direktori

```
apps/
├── web/                    # AKTIF
│   ├── src/
│   │   ├── pages/          # Astro pages
│   │   │   └── api/        # API endpoints (Workers)
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities (prisma, auth)
│   │   └── services/       # Business logic
│   ├── prisma/             # Database schema
│   └── wrangler.toml       # Cloudflare config
└── api/                    # DEPRECATED - JANGAN MODIFY
```

---

## ⛔ PROHIBITED ACTIONS

AI Agents **DILARANG KERAS**:

1. **Mengubah tech stack** - Stack sudah final
2. **Menambah dependencies** tanpa approval user
3. **Membuat file dokumentasi baru** - Update yang ada saja
4. **Modify `apps/api/`** - Deprecated
5. **Menambah fitur di luar blueprint** - Lihat "Out of Scope" di blueprint.md
6. **Menggunakan Node.js APIs** - Workers tidak support fs, path, etc.
7. **Hardcode secrets** - Gunakan environment variables
8. **Skip testing** - Selalu `pnpm build` sebelum commit
9. **Menambah integrasi baru** - Hanya Midtrans yang diizinkan

---

## ✅ ALLOWED ACTIONS

AI Agents **BOLEH**:

1. Mengerjakan task dari `task.md`
2. Fix bugs dari `bug.md`
3. Update dokumentasi yang sudah ada
4. Refactor dalam scope task
5. Commit dengan Conventional Commits

---

## 📋 Workflow

```
1. Baca task.md → Pilih task pertama yang belum selesai
2. Baca blueprint.md → Pahami spesifikasi
3. Implementasi → Code changes
4. Test → pnpm build
5. Update task.md → Mark [x]
6. Commit → Conventional Commits
7. Create PR → ke branch 'dev'
```

---

## 🏷️ Conventional Commits

```
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
refactor(scope): code refactoring
```

Contoh:
```
feat(auth): implement login endpoint
fix(billing): handle midtrans webhook error
docs(blueprint): update database schema
```

---

## 🔒 Security Rules

1. **Passwords**: Hash dengan bcrypt/argon2
2. **JWT**: Short expiry (15min access, 7d refresh)
3. **Input validation**: Zod untuk semua input
4. **SQL**: Gunakan Prisma (no raw queries)
5. **Secrets**: Semua via `wrangler secret put`

---

## 🚫 Out of Scope (V1)

Jangan implementasi ini di V1:
- WhatsApp notification
- Real-time updates (WebSocket)
- Ticket system
- CRM
- Complex RBAC
- File versioning
- Multi-tenant

---

**Branch**: `dev`
**Deployment**: Cloudflare Pages
