# 📋 Task List

Daftar task untuk AI agents. Update file ini setelah menyelesaikan task.

---

## 🔄 Migration to Cloudflare (Priority: HIGH)

### Phase 1: Database
- [ ] Move prisma schema dari `apps/api/prisma/` ke `apps/web/prisma/`
- [ ] Update schema.prisma dengan `runtime = "cloudflare"`
- [ ] Create `apps/web/src/lib/prisma.ts` factory function
- [ ] Install `@prisma/adapter-pg` dan `pg`
- [ ] Verify `pnpm prisma generate` works

### Phase 2: Cache
- [ ] Create `apps/web/src/services/cache.service.ts`
- [ ] Implement KVCacheService class
- [ ] Update wrangler.toml dengan KV namespace
- [ ] Remove Redis dependencies dari apps/web

### Phase 3: Storage
- [ ] Create `apps/web/src/services/storage.service.ts`
- [ ] Implement R2StorageService class
- [ ] Update wrangler.toml dengan R2 bucket binding

### Phase 4: Backend
- [ ] Create `apps/web/src/pages/api/health.ts`
- [ ] Create `apps/web/src/pages/api/auth/login.ts`
- [ ] Create `apps/web/src/pages/api/auth/logout.ts`
- [ ] Add Cloudflare env types ke `apps/web/src/env.d.ts`

### Phase 5: Cleanup
- [ ] Verify build passes: `pnpm build`
- [ ] Verify tests pass: `pnpm test`
- [ ] Update README.md dengan new stack
- [ ] Create MIGRATION_COMPLETE.md

---

## 🐛 Bugs (Priority: MEDIUM)

_No open bugs_

---

## 📝 Documentation (Priority: LOW)

- [ ] Update README.md tech stack section
- [ ] Update AGENTS.md after migration complete

---

## ✅ Completed

_Tasks yang sudah selesai dipindahkan ke sini_

---

**Last Updated**: 2025-12-20
