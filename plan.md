# Rencana Proyek — Website Jasa Pembuatan Website + Client Portal

## 1) Tujuan & KPI
**Tujuan utama**
- Menghasilkan lead berkualitas untuk layanan: **Website Sekolah**, **Portal Berita**, **Company Profile**.
- Mempercepat kolaborasi klien melalui **Client Portal** (single source of truth).
- Menstandarkan delivery (design system, komponen, alur persetujuan) agar **cycle time** proyek lebih pendek.

**KPI keberhasilan**
- CVR Landing → Form Penawaran ≥ **5–8%**.
- Lead → Proposal Terkirim ≥ **60%**; Proposal → Deal ≥ **30%**.
- Waktu rata-rata dari kickoff → go‑live: **≤ 8–10 minggu**.
- Skor kepuasan klien (NPS) **≥ 8/10**.
- SLA respons tiket **≤ 4 jam** pada jam kerja.

---

## 2) Cakupan Produk
### 2.1 Public Marketing Site
- Landing Page dengan segmentasi 3 layanan (Sekolah, Berita, Company Profile).
- Halaman Layanan (fitur, demo, paket harga, FAQ).
- Portofolio & Studi Kasus (filter menurut industri/jenis proyek).
- Blog/Artikel & Resource (ebook/checklist, lead magnet).
- Halaman Tentang, Kontak (form + booking meeting), Testimoni, Partner.
- Otentikasi Login ke **Client Portal**.

### 2.2 Client Portal (untuk klien)
- **Dashboard** proyek: ringkasan milestone, jadwal, blocker/risiko, tiket terbuka, status domain/SSL, link staging & produksi.
- **Proyek**: timeline Gantt ringan, backlog tugas, **milestone** & **deliverables**, checklist UAT, **approval flow**.
- **File/Assets**: unggah/unduh, versi, pratinjau (gambar/PDF/video), folder per proyek.
- **Approvals**: kirim desain/halaman untuk persetujuan, komentar berangkai, cap waktu & audit trail.
- **Tiket/Support**: buat tiket, SLA, prioritas, assignment, status; riwayat solusi, rating after‑resolve.
- **Tagihan & Pembayaran**: invoice, status pembayaran, unduh kwitansi; opsi cicilan/milestone billing.
- **Laporan**: snapshot GA4 (trafik), Web Vitals, uptime, status backup.
- **Content Intake**: formulir pengumpulan konten (teks, gambar, dokumen) per halaman/sektion.
- **Change Request**: ajukan permintaan perubahan, estimasi otomatis, persetujuan scope & biaya.
- **Organisasi & Pengguna**: manajemen user klien (Owner, Admin, Finance, Reviewer), undang via email.
- **Notifikasi & Preferensi**: email/in‑app digest, frekuensi, kategori.
- **Knowledge Base**: panduan penggunaan, SOP, video tutorial.

### 2.3 Admin/Ops (internal)
- CRM ringan: pipeline lead → deal, template proposal, e‑sign.
- Manajemen proyek lintas klien, kapasitas tim, SLA operasi.
- Library komponen & template (page kit) untuk akselerasi.
- Audit log, pengaturan sistem, pengelolaan paket & harga.

---

## 3) Persona & Peran (RBAC)
- **External/Client**: Org Owner, Org Admin, Finance, Reviewer/Stakeholder, Guest (read‑only).
- **Internal**: PM, Designer, Developer, Support, Finance, Super Admin.

---

## 4) Arsitektur Teknis (rekomendasi)
- **Frontend (Public + Portal)**: Next.js 14 (SSR/ISR), Tailwind, shadcn/ui, Form schema dengan Zod.
- **Backend API**: Node.js (NestJS) dengan REST/tRPC; alternatif: Laravel.
- **Database**: PostgreSQL (multi‑tenant via `organization_id`).
- **ORM**: Prisma. **Cache/Queue**: Redis. **Storage**: S3‑compatible (minIO/Wasabi/AWS).
- **Auth**: Auth.js/NextAuth (Email/Google/Microsoft), 2FA TOTP, magic link, RBAC.
- **Pembayaran**: integrasi gateway (Stripe/Midtrans/Xendit) — pluggable.
- **Email**: transactional (Resend/SMTP), domain DKIM/SPF.
- **Analytics**: GA4 + server‑side events (opsional Matomo untuk self‑hosted).
- **Search**: Postgres trigram atau Meilisearch (opsional).
- **Infra**: Vercel (FE) + Fly.io/Railway (API), Docker, CDN, object storage.

---

## 5) Keamanan & Kepatuhan
- OWASP Top 10, rate limiting, CORS ketat, CSRF untuk form.
- Enkripsi at rest (S3+KMS) & in transit (HTTPS), hashing password Argon2.
- **Audit Log** tiap aksi penting (upload, approve, bayar, ubah hak akses).
- Backup otomatis harian + retensi 30/90 hari, uji restore berkala.
- Kepatuhan privasi (UU PDP Indonesia), minimasi PII, consent cookie.

---

## 6) Fitur Detail per Layanan (Public Site)
### 6.1 Website Sekolah
- Berita & Agenda Sekolah, Kalender Akademik, Profil Guru/Staff, Galeri.
- Halaman PPDB/Pendaftaran (form, upload berkas), unduh brosur.
- Integrasi link LMS/e‑learning eksternal, multi‑bahasa (opsional).

### 6.2 Portal Berita
- Manajemen kategori/tag, profil penulis, editor workflow (draft → review → publish), penjadwalan.
- Editor konten WYSIWYG/Markdown, image optimization, open graph, schema.org Article.
- Newsletter & RSS, halaman topik, arsip, pencarian cepat.

### 6.3 Company Profile
- Halaman produk/layanan, About/Visi, Tim & Karier, Testimoni, Peta & Kontak.
- CTA penawaran/meeting; unduh company deck/proposal contoh.

---

## 7) Informasi Arsitektur (Sitemap Ringkas)
**Public**: Home · Layanan (Sekolah, Portal Berita, Company Profile) · Portofolio · Paket & Harga · Demo · Blog · Resource · Tentang · FAQ · Kontak · **Login**.

**Client Portal**: Dashboard · Projects · Files · Approvals · Tickets · Invoices · Reports · Knowledge Base · Organization/Users · Settings.

---

## 8) Skema Data (tingkat konsep)
- `organizations(id, name, billing_email, plan, settings)`
- `users(id, name, email, auth_provider, twofa_enabled)`
- `memberships(user_id, organization_id, role)`
- `projects(id, organization_id, name, status, start_at, due_at)`
- `milestones(id, project_id, title, due_at, status)`
- `tasks(id, project_id, title, assignee_id, status, due_at, labels)`
- `files(id, project_id, folder, filename, version, size, checksum, uploaded_by)`
- `approvals(id, project_id, item_type, item_id, status, decided_by, decided_at, note)`
- `tickets(id, organization_id, project_id, type, priority, status, assignee_id, sla_due_at)`
- `invoices(id, organization_id, project_id, amount, currency, issued_at, due_at, status)`
- `payments(id, invoice_id, gateway, paid_at, amount, reference)`
- `reports(id, project_id, kpi, payload, captured_at)`
- `notifications(id, user_id, type, payload, read_at)`
- `audit_logs(id, actor_id, organization_id, action, target, meta, created_at)`

---

## 9) Alur Kunci (Wire‑Flow)
1. **Lead → Proposal → E‑Sign → DP** → otomatis buat **Organization + Project** + akses portal.
2. **Approval desain**: kirim artboard/URL → komentar → revisi → approve (tanda tangan digital ringan + cap waktu).
3. **Content Intake**: klien isi form per halaman (judul, hero, gambar, copy) → masuk backlog konten.
4. **UAT**: checklist per fitur/halaman → tandai lulus/gagal, re‑open.
5. **Change Request**: form → estimasi → persetujuan → invoice add‑on.
6. **Support**: tiket masuk → triage prioritas/SLA → resolusi → rating.

---

## 10) Roadmap & Prioritas
**MVP (gelombang 1)**
- Public site lengkap + CMS konten.
- Auth dasar (email/password + magic link), RBAC & multi‑tenant.
- Modul **Projects, Milestones, Files, Approvals** dasar.
- **Tickets** sederhana (tanpa SLA otomatis), **Invoices** manual (upload PDF).
- **Dashboard** dengan widget status proyek & link lingkungan.
- Integrasi **GA4** & email transactional, backup dasar.

**Next (gelombang 2–3)**
- Pembayaran online (gateway), SLA otomatis & laporan, Knowledge Base, komentar beranotasi pada pratinjau.
- Laporan Web Vitals & uptime, white‑label portal, SSO perusahaan.
- Automasi notifikasi (digest), API publik & webhook, Meilisearch.

---

## 11) Teknologi & Tooling (detail)
- FE: Next.js 14, React Server Components, Tailwind, shadcn/ui, Framer Motion.
- API: NestJS, Prisma, Zod, tRPC/REST, Swagger docs.
- Infra: Docker, Vercel (FE), Fly.io/Railway (API), S3 storage, CDN.
- Observability: Sentry (error), OpenTelemetry (traces), Logtail/ELK (log), UptimeRobot (uptime).
- QA: Jest/Vitest, Playwright (E2E), Lighthouse CI (perf).

---

## 12) DevOps & Operasional
- Git (trunk‑based), PR review, conventional commits, semantic release.
- CI/CD: build, test, lint, scan dependency, migrate DB otomatis.
- Environments: **Dev → Staging → Production**; feature flags.
- Manajemen rahasia: Vault/1Password Connect, rotasi kunci.
- Backup DB harian, storage lifecycle policy, runbook disaster recovery.

---

## 13) QA, Keandalan & Aksesibilitas
- Test: unit, integrasi, E2E, regression sebelum rilis.
- Performance budget (TTFB < 200ms, LCP < 2.5s di 75th percentile).
- A11y: WCAG 2.2 AA, keyboard‑friendly, ARIA, kontras.

---

## 14) Konten, SEO, & Growth
- Riset keyword per segmen (Sekolah/Berita/Company). Cluster topik blog.
- Skema terstruktur (Organization, Article, FAQ), sitemap & robots.
- Optimasi kecepatan (ISR, image optimization, caching, CDN).
- Lead magnet (template RFP, checklist vendor), email nurture.

---

## 15) Legal & Kepatuhan
- Privacy Policy, Terms of Service, SLA dukungan, DPA untuk klien.
- Cookie banner (opsional mode consent), lisensi aset.

---

## 16) Timeline Implementasi (estimasi 10–12 minggu)
- **Minggu 1–2**: Discovery, IA, wireframe, arsitektur, spike teknis.
- **Minggu 3–4**: Desain UI + design system, setup repo & CI/CD.
- **Minggu 5–8**: Implementasi MVP (public site + portal inti).
- **Minggu 9**: QA, hardening security, konten, migrasi awal.
- **Minggu 10**: UAT klien pilot, perbaikan, persiapan rilis.
- **Minggu 11–12**: Launch, hypercare, dokumentasi, training.

---

## 17) Deliverables
- Public website siap produksi, CMS & komponen UI.
- Client Portal MVP (fitur pada bagian 10/MVP).
- Design system (tokens, komponen), ikon, ilustrasi kunci.
- Dokumen arsitektur, API spec, peta data & RBAC.
- Pipeline CI/CD, observability & runbook operasional.
- Manual penggunaan + video singkat untuk klien.

---

## 18) Risiko & Mitigasi
- **Scope creep** → kontrak CR & mekanisme approval.
- **Dependensi eksternal** (gateway/email) → abstraksi adapter & fallback.
- **Konten terlambat** → Content Intake & checklist UAT.
- **Teknis**: performa & a11y → budget, CI Lighthouse, audit berkala.

---

## 19) Kriteria Penerimaan (MVP)
- Semua peran dapat login & melihat hanya data organisasinya.
- Proyek memiliki ≥1 milestone, file upload/download, dan 1 siklus approval sukses.
- Ticket dapat dibuat, diperbarui statusnya, dan ditutup dengan notifikasi email.
- Invoice manual dapat diunggah, status tercatat, dan dapat diunduh klien.
- Dashboard menampilkan widget proyek, tiket terbuka, dan link lingkungan.
- Public site lulus audit Lighthouse ≥ 90 (Performance, SEO, A11y, Best Practices) pada desktop.

---

## 20) Lampiran
### 20.1 Widget Dashboard Klien (contoh)
- Status ringkas proyek (progress %, milestone berikutnya, blocker).
- Tiket terbuka (5 terbaru) + tombol buat tiket.
- Invoices (due/overdue) + tombol bayar/konfirmasi.
- Link cepat: staging, produksi, dokumentasi proyek, repo (opsional).
- Web Vitals snapshot, uptime 24 jam, status backup terakhir.

### 20.2 Matriks Notifikasi (contoh)
- Approvals: requested → reviewer, hasil → requester.
- Ticket: created/assigned/status change/closed → pelapor & assignee.
- Invoice: issued/due/paid → finance & owner.
- Project: milestone due soon/overdue → semua member proyek.

### 20.3 Template Email (judul)
- Welcome to Client Portal, Project Kickoff, Approval Needed, Ticket Resolved, Invoice Issued, UAT Checklist.

---

## 21) Backlog Terstruktur (Epics → Tasks)
**E1. Foundation & Infra**
- Setup monorepo (apps/web, apps/api, packages/ui)
- CI/CD pipeline + lint/test/build
- Konfigurasi database & Prisma schema dasar

**E2. Auth & RBAC**
- Implementasi sign‑in email/magic link
- Organisasi & membership
- RBAC middleware & guard
- 2FA TOTP

**E3. Public Marketing Site**
- IA + sitemap + routing
- Hero & landing (segmen 3 layanan)
- Halaman layanan (Sekolah/Berita/Company)
- Portofolio + studi kasus
- Blog + CMS (admin)
- Kontak + form booking

**E4. Client Portal — Inti**
- Layout portal & navigasi
- Modul Projects & Milestones
- Modul Files (upload, preview, versi)
- Modul Approvals (request, approve/reject)
- Dashboard widget dasar

**E5. Support & Billing**
- Modul Tickets sederhana
- Modul Invoices (manual upload)

**E6. Reporting & Integrasi**
- Integrasi GA4 server‑side events
- Web Vitals snapshot & uptime (SDK)

**E7. Hardening & UAT**
- Audit security & a11y
- QA regression & UAT pilot
- Dokumentasi & training

---

## 22) Estimasi Biaya (opsional, placeholder)
- **Discovery & Desain**: 15–20%
- **Implementasi MVP**: 55–65%
- **QA, Launch, Hypercare**: 15–20%
- **Ops/Bulanan (hosting, support)**: tergantung paket SLA.

