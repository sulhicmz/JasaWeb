# Blueprint Proyek - JasaWeb

## 1. Tujuan & KPI

### Tujuan Utama

- Menghasilkan lead berkualitas untuk layanan: **Website Sekolah**, **Portal Berita**, **Company Profile**.
- Mempercepat kolaborasi klien melalui **Client Portal** (single source of truth).
- Menstandarkan delivery (design system, komponen, alur persetujuan) agar **cycle time** proyek lebih pendek.

### KPI Keberhasilan

- CVR Landing → Form Penawaran ≥ **5–8%**.
- Lead → Proposal Terkirim ≥ **60%**; Proposal → Deal ≥ **30%**.
- Waktu rata-rata dari kickoff → go‑live: **≤ 8–10 minggu**.
- Skor kepuasan klien (NPS) **≥ 8/10**.
- SLA respons tiket **≤ 4 jam** pada jam kerja.

---

## 2. Cakupan Produk

### 2.1 Public Marketing Site

- **Landing Page**: Segmentasi 3 layanan (Sekolah, Berita, Company Profile).
- **Halaman Layanan**: Fitur, demo, paket harga, FAQ.
- **Portofolio**: Filter menurut industri/jenis proyek.
- **Blog/Resource**: Ebook/checklist, lead magnet.
- **Umum**: Tentang, Kontak (form + booking), Testimoni, Partner, Login Portal.

### 2.2 Client Portal (Klien)

- **Dashboard**: Ringkasan milestone, jadwal, blocker, tiket, status domain/SSL.
- **Proyek**: Gantt, backlog, milestone, checklist UAT, approval flow.
- **Files**: Unggah/unduh, versioning, pratinjau, folder.
- **Approvals**: Persetujuan desain/halaman, komentar, audit trail.
- **Tiket/Support**: Pembuatan tiket, tracking SLA, rating.
- **Billing**: Invoice, status bayar, kwitansi, cicilan.
- **Laporan**: GA4, Web Vitals, uptime, backup.
- **Content Intake**: Form pengumpulan konten per seksi.
- **Change Request**: Form CR, estimasi, approval biaya.
- **Manajemen**: User management, notifikasi, knowledge base.

### 2.3 Admin/Ops (Internal)

- **CRM Ringan**: Pipeline lead → deal, proposal, e-sign.
- **Manajemen**: Proyek lintas klien, kapasitas tim.
- **Library**: Komponen & template.
- **System**: Audit log, pengaturan, paket harga.

---

## 3. Persona & Peran (RBAC)

- **External/Client**:
  - Org Owner (Akses penuh org)
  - Org Admin (Manajemen user org)
  - Finance (Billing access)
  - Reviewer/Stakeholder (Approval access)
  - Guest (Read-only)
- **Internal**:
  - PM (Project Manager)
  - Designer
  - Developer
  - Support
  - Finance
  - Super Admin

---

## 4. Arsitektur Teknis

### Stack

- **Frontend**: Next.js 14 / Astro 5 (SSR/ISR), Tailwind, shadcn/ui, Zod.
- **Backend**: NestJS (REST/tRPC).
- **Database**: PostgreSQL (Multi-tenant via `organization_id`).
- **ORM**: Prisma.
- **Cache/Queue**: Redis.
- **Storage**: S3-compatible (MinIO/Wasabi/AWS).
- **Auth**: Auth.js / NextAuth (Email/Google/Microsoft), 2FA TOTP, RBAC.

### Infrastruktur

- **Hosting**: Vercel (FE) + Fly.io/Railway (API).
- **Container**: Docker.
- **CDN**: Cloudflare / AWS CloudFront.
- **Observability**: Sentry, OpenTelemetry.

---

## 5. Keamanan & Kepatuhan

- **Standar**: OWASP Top 10 compliance dengan implementasi mendalam.
- **Proteksi**: Rate limiting dinamis, CORS strict dengan validasi, CSRF protection, dan security interceptor.
- **Enkripsi**: At rest (S3+KMS), In transit (HTTPS), Argon2 password hashing dengan salted rounds.
- **Audit**: Log aktivitas penting dengan audit trail terperinci, security logging, dan real-time monitoring.
- **Monitoring**: Security event logging, automated alerts untuk critical events, dan SIEM integration readiness.
- **Backup**: Harian otomatis + retensi 30/90 hari dengan encryption.
- **Privasi**: Compliance UU PDP (Minimasi PII, consent), data sanitization di logs, dan sensitive data redaction.

---

## 6. Informasi Arsitektur (Sitemap)

**Public**:
`Home` · `Layanan` (Sekolah, Berita, Company) · `Portofolio` · `Harga` · `Demo` · `Blog` · `Resource` · `Tentang` · `FAQ` · `Kontak` · `Login`

**Client Portal**:
`Dashboard` · `Projects` · `Files` · `Approvals` · `Tickets` · `Invoices` · `Reports` · `Knowledge Base` · `Settings` (Org/Users)

---

## 7. Skema Data (Konseptual)

- `organizations`: id, name, billing_email, plan, settings
- `users`: id, name, email, auth_provider, twofa_enabled
- `memberships`: user_id, organization_id, role
- `projects`: id, organization_id, name, status, timeline
- `milestones`: id, project_id, title, due_at, status
- `tasks`: id, project_id, title, assignee, status
- `files`: id, project_id, folder, filename, version, checksum
- `approvals`: id, project_id, item_type, status, decided_by
- `tickets`: id, org_id, type, priority, status, sla_due
- `invoices`: id, org_id, amount, status, issued_at
- `audit_logs`: id, actor_id, org_id, action, target, meta

---

## 8. Alur Kunci

1. **Onboarding**: Lead → Proposal → Sign → DP → Auto-create Org/Project.
2. **Approval**: Upload Artboard → Comment → Revise → Approve (Digital Sign).
3. **Content**: Client fill Content Intake → Backlog.
4. **UAT**: Checklist feature → Pass/Fail → Go-Live.
5. **Support**: Ticket → Triage → Resolve → Rating.

---

## 9. Teknologi Detail

- **FE**: Astro 5 + React, Tailwind v4, Framer Motion.
- **API**: NestJS 10, Class-Validator, Swagger.
- **QA**: Vitest (Unit) + SWC (Transform), Playwright (E2E), Lighthouse (Perf).
- **DevOps**: Trunk-based Git, Conventional Commits.

---

## 10. Risiko & Mitigasi

- **Scope Creep**: Manage via Change Request contracts.
- **Dependencies**: Abstract adapters for external services (Payment/Email).
- **Content Delay**: Use structured Content Intake forms early.
- **Performance**: Lighthouse CI budgets & regular audits.

---

## 11. Project Stability Status

### Current State: **STABLE** (as of 2025-12-17)

#### Critical Infrastructure Components:

- ✅ **TypeScript Compilation**: 0 errors, 0 warnings
- ✅ **Prisma Integration**: Complete schema with generated types
- ✅ **Build Process**: Successful compilation for all packages
- ✅ **Dependencies**: Resolved conflicts and updated security patches
- ✅ **Real-time Features**: WebSocket gateway with multi-tenant support
- ✅ **Multi-tenant Architecture**: Secure data isolation and RBAC

#### Core Modules Status:

- ✅ **Authentication**: JWT with refresh tokens and session management
- ✅ **Database**: PostgreSQL with Prisma ORM, fully operational
- ✅ **File Management**: S3 adapter with validation and security
- ✅ **Dashboard**: Real-time updates and data visualization
- ✅ **Notification System**: Email, in-app, and desktop notifications
- ✅ **Audit Logging**: Comprehensive security event tracking

#### Development Readiness:

- ✅ **Development Environment**: Fully configured and operational
- ✅ **Code Quality**: ESLint (~90 warnings, -28% total improvement), Prettier, and strict TypeScript enforcement
- ✅ **Testing Framework**: Vitest unit tests and E2E test infrastructure
- ✅ **Documentation**: Complete API and architecture documentation
- ✅ **CI/CD**: GitHub Actions with build validation
- ✅ **Security**: Enhanced with comprehensive type safety and object injection prevention
- ✅ **Maintainability**: Improved through systematic code quality refactoring

#### Latest Security Enhancements (2025-12-17):

- ✅ **Object Injection Protection**: Fixed Generic Object Injection Sinks across security-sensitive modules
- ✅ **Prototype Pollution Prevention**: Implemented safe object creation using Object.create(null)
- ✅ **Type Safety Improvements**: Replaced all `any` types with proper TypeScript interfaces
- ✅ **Safe Property Management**: Used Object.defineProperty for controlled property assignments
- ✅ **Input Validation**: Enhanced validation against dangerous prototype properties
- ✅ **Code Structure**: Utilized Map/Set for dynamic access patterns
- ✅ **Security Monitoring**: Maintained functional integrity while eliminating attack vectors

This stable foundation enables rapid feature development with confidence in the underlying infrastructure reliability.
