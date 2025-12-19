# 📋 Task List

Checklist untuk AI agents. Update setelah selesai task.

---

## 🔴 Priority: HIGH - Infrastructure

### Phase 1: Database Setup
- [ ] Create `apps/web/prisma/schema.prisma` dengan schema dari blueprint
- [ ] Add Prisma config: `runtime = "cloudflare"`, `previewFeatures = ["driverAdapters"]`
- [ ] Create `apps/web/src/lib/prisma.ts` factory function
- [ ] Install: `@prisma/client`, `@prisma/adapter-pg`, `pg`
- [ ] Verify: `pnpm prisma generate`

### Phase 2: Services Setup
- [ ] Create `apps/web/src/services/cache.service.ts` (Cloudflare KV)
- [ ] Create `apps/web/src/services/storage.service.ts` (Cloudflare R2)
- [ ] Update `apps/web/wrangler.toml` dengan bindings

### Phase 3: Auth
- [ ] Create `apps/web/src/pages/api/auth/register.ts`
- [ ] Create `apps/web/src/pages/api/auth/login.ts`
- [ ] Create `apps/web/src/pages/api/auth/logout.ts`
- [ ] Create `apps/web/src/pages/api/auth/me.ts`
- [ ] Create `apps/web/src/lib/auth.ts` (JWT utilities)

---

## 🟡 Priority: MEDIUM - Features

### Public Site
- [ ] Landing page dengan 3 layanan
- [ ] Template gallery page
- [ ] Pricing page
- [ ] Blog list & detail page
- [ ] Register page
- [ ] Login page

### Client Portal
- [ ] Dashboard page
- [ ] Web Saya (projects list)
- [ ] Project detail page
- [ ] Billing page
- [ ] Akun Saya page

### Admin Panel
- [ ] Admin dashboard
- [ ] Manage clients (CRUD)
- [ ] Manage projects (CRUD + update status)
- [ ] Manage blog (CRUD)
- [ ] Manage pages (CRUD)
- [ ] Manage templates (CRUD)

---

## 🟢 Priority: LOW - Payment

### Midtrans Integration
- [ ] Install Midtrans SDK
- [ ] Create `apps/web/src/lib/midtrans.ts`
- [ ] Create `apps/web/src/pages/api/invoices/[id]/pay.ts`
- [ ] Create `apps/web/src/pages/api/webhooks/midtrans.ts`
- [ ] Test payment flow

---

## ✅ Completed

_Move completed tasks here with date_

---

**Last Updated**: 2025-12-20
