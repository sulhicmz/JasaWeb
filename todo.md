# TODO — JasaWeb Implementation Plan

Source: `AGENTS.md` + `/docs/` directory. This checklist unifies tooling (pnpm, Vitest/Playwright, Prettier) with MVP scope.

## 0) Prerequisites & Tooling

- [x] Node 20 (set `.nvmrc`) and `engines` in `package.json`
- [x] `corepack enable` and set pnpm version in `.npmrc`
- [x] Lint/format configuration: ESLint + Prettier (root) and `pnpm lint|format`
- [x] Template `.env.example` (API, DB, S3, Email)

## 1) Workspace & Structure

- [x] Initialize pnpm monorepo: `apps/web`, `apps/api`, `packages/ui`, `packages/config`, `packages/testing`
- [x] Path alias & tsconfig base (root + per app)
- [x] GitHub Actions: Lint → Test → Build for PR and `main`
- [x] Docker Compose dev: Postgres, Redis, S3 mock (minio)

## 2) apps/web — Astro (Marketing Site)

- [x] Setup Astro + Tailwind; structure `src/pages`, `src/components`
- [x] Pages: Home, Services (School/News/Company), Portfolio, Blog, About, Contact, Login to Portal
- [x] Lightweight CMS (collection/content) for blog/portfolio
- [x] Contact form + validation + email trigger
- [ ] Target Lighthouse desktop ≥ 90 (Perf/SEO/A11y/Best)

## 3) apps/api — NestJS (Client Portal API)

- [x] Prisma + PostgreSQL; migrate core schema (users, orgs, projects, milestones, files, approvals, tickets, invoices, audit_logs)
- [x] Basic auth: email/password + magic link; JWT/session + refresh
- [x] Multi‑tenant + RBAC (owner, admin, reviewer, finance)
- [x] Modules: Projects, Milestones, Files (S3 adapter + local mock), Approvals, Tickets, Invoices
- [x] Transactional email (Resend/SMTP) + basic templates
- [x] OpenAPI/Swagger + healthcheck + metrics endpoint

## 4) Shared Packages

- [x] `packages/ui`: basic components + Tailwind tokens
- [x] `packages/config`: eslint, prettier, shared tsconfig
- [ ] `packages/testing`: test utils, fixtures, API contracts

## 5) Quality — Test & Coverage

- [x] Unit tests with Vitest (critical coverage target ≥ 80%)
- [ ] API contracts (`apps/api/tests/contracts`) and stable snapshots
- [x] Add targeted test commands (e.g. `pnpm vitest run apps/api/auth/auth.service.spec.ts`) in CI before merge to prevent Vitest from running thousands of dependency files

## 6) Security & Compliance

- [x] Rate limit, strict CORS, CSRF for forms
- [x] OWASP Top 10 compliance checks
- [x] Multi-tenant data isolation
- [x] Audit logging for critical actions
- [x] Input validation and sanitization

## 7) Deployment & Infrastructure

- [x] Production-ready Docker configurations
- [x] Environment configuration management
- [x] Health checks and monitoring endpoints
- [ ] Staging environment setup
- [ ] Production deployment pipeline

## 8) Current Tasks (ACTIVE)

- [x] Lighthouse performance optimization for marketing site
- [x] Complete API contract testing setup
- [x] Repository hygiene and configuration standardization
- [ ] Set up staging environment
- [ ] Finalize production deployment pipeline

## 9) Known Issues & Technical Debt

- [x] Resolve TODO comments in dynamic-file-storage.service.ts
- [x] Optimize large bundle imports in frontend
- [x] Complete TypeScript strict mode compliance
- [x] Update outdated dependencies
- [ ] Consolidate test helpers across packages
- [ ] Standardize ESLint configurations across packages

## 10) Next Steps (FUTURE)

- [ ] Online payment gateway integration
- [ ] Automated SLA and reporting
- [ ] Knowledge Base implementation
- [ ] White-label portal and corporate SSO

---

_Last updated: 2025-12-19_  
_Status: MVP complete, repository hygiene completed, deployment in progress_
