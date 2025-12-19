# Roadmap & Timeline - JasaWeb

## 1. Roadmap & Prioritas

### MVP (Gelombang 1)
- **Public Site**: Lengkap dengan CMS konten.
- **Auth**: Dasar (email/password + magic link), RBAC & multi-tenant.
- **Modul Inti**: Projects, Milestones, Files, Approvals dasar.
- **Tickets**: Sederhana (tanpa SLA otomatis).
- **Invoices**: Manual (upload PDF).
- **Dashboard**: Widget status proyek & link lingkungan.
- **Integrasi**: GA4 & email transactional, backup dasar.

### Next (Gelombang 2–3)
- **Payments**: Gateway pembayaran online.
- **Automation**: SLA otomatis, laporan.
- **Knowledge Base**: Panduan & artikel helpdesk.
- **Features**: Komentar beranotasi pada pratinjau.
- **Reporting**: Web Vitals & uptime.
- **Enterprise**: White-label portal, SSO perusahaan.
- **Advanced**: Automasi notifikasi (digest), API publik & webhook, Meilisearch.

---

## 2. Timeline Implementasi (Estimasi 10–12 Minggu)

| Minggu | Fokus Utama | Aktivitas Detail |
| :--- | :--- | :--- |
| **1–2** | **Discovery & Setup** | Discovery, IA, wireframe, arsitektur, spike teknis. |
| **3–4** | **Design & Infra** | Desain UI + design system, setup repo & CI/CD. |
| **5–8** | **Implementasi MVP** | Development public site + client portal inti. |
| **9** | **QA & Security** | QA regression, hardening security, konten, migrasi awal. |
| **10** | **UAT** | UAT klien pilot, perbaikan, persiapan rilis. |
| **11–12** | **Launch** | Go-live, hypercare, dokumentasi, training. |

---

## 3. Backlog Terstruktur (Epics → Tasks)

### E1. Foundation & Infra
- [ ] Setup monorepo (apps/web, apps/api, packages/ui)
- [ ] CI/CD pipeline + lint/test/build
- [ ] Konfigurasi database & Prisma schema dasar

### E2. Auth & RBAC
- [ ] Implementasi sign-in email/magic link
- [ ] Organisasi & membership
- [ ] RBAC middleware & guard
- [ ] 2FA TOTP

### E3. Public Marketing Site
- [ ] IA + sitemap + routing
- [ ] Hero & landing (segmen 3 layanan)
- [ ] Halaman layanan (Sekolah/Berita/Company)
- [ ] Portofolio + studi kasus
- [ ] Blog + CMS (admin)
- [ ] Kontak + form booking

### E4. Client Portal — Inti
- [ ] Layout portal & navigasi
- [ ] Modul Projects & Milestones
- [ ] Modul Files (upload, preview, versi)
- [ ] Modul Approvals (request, approve/reject)
- [ ] Dashboard widget dasar

### E5. Support & Billing
- [ ] Modul Tickets sederhana
- [ ] Modul Invoices (manual upload)

### E6. Reporting & Integrasi
- [ ] Integrasi GA4 server-side events
- [ ] Web Vitals snapshot & uptime (SDK)

### E7. Hardening & UAT
- [ ] Audit security & a11y
- [ ] QA regression & UAT pilot
- [ ] Dokumentasi & training

---

## 4. Estimasi Biaya (Placeholder)

- **Discovery & Desain**: 15–20%
- **Implementasi MVP**: 55–65%
- **QA, Launch, Hypercare**: 15–20%
- **Ops/Bulanan (hosting, support)**: Tergantung paket SLA.
