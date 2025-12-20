# Roadmap - JasaWeb

## Timeline

### Phase 1: Infrastructure (Week 1) ✅
- [x] Setup Prisma schema
- [x] Setup Cloudflare KV & R2 services
- [x] Setup auth (JWT)

### Phase 2: Public Site (Week 2) ✅
- [x] Landing page
- [x] Template gallery
- [x] Pricing page
- [x] Service pages (3)
- [x] Register & Login

### Phase 3: Client Portal (Week 3) ✅
- [x] Dashboard
- [x] Web Saya (projects)
- [x] Akun Saya (profile + password)
- [ ] Billing (pending Phase 5)

### Phase 4: Admin Panel (Week 4) ⏳
- [x] Fix: Type system errors in middleware and API routes
- [x] Fix: ErrorBoundary component props access
- [ ] Fix: Rate limiting sliding window behavior → implement fixed window
- [ ] Add CSRF protection for authenticated routes
- [ ] Expand test coverage to API routes and components
- [ ] Dashboard overview
- [ ] Manage clients (CRUD)
- [ ] Manage projects (status, URL, credentials)
- [ ] Manage blog (CRUD)
- [ ] Manage pages (CMS)
- [ ] Manage templates (CRUD)

### Phase 5: Payment (Week 5) ❌
- [ ] Midtrans integration
- [ ] QRIS payment
- [ ] Webhook handler
- [ ] Invoice management

### Phase 6: Testing & Launch (Week 6) ❌
- [x] Fix TypeScript type system (0 errors)
- [x] Install and configure Vitest properly
- [x] Fix middleware auth flow (locals.request issue)
- [ ] Setup Vitest + testing-library for components
- [ ] API integration tests (auth endpoints, CRUD operations)
- [ ] End-to-end testing (critical user flows)
- [ ] Security hardening (CSRF tokens, rate limiting fix)
- [ ] Production deployment

---

## Current Status

| Phase | Progress | Notes |
|-------|----------|-------|
| 1 | 100% | Core infra complete |
| 2 | 100% | Public site live |
| 3 | 95% | Standardization complete, Billing pending |
| 4 | 30% | TypeScript errors fixed, build stable, security improvements needed |
| 5 | 0% | Blocked on Phase 4 |
| 6 | 0% | Final phase |

---

## Estimated Timeline: 6 Weeks

---

**Last Updated**: 2025-12-20
