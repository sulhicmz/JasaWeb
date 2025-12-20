# Blueprint - JasaWeb

Platform jasa pembuatan website (Sekolah, Berita, Company Profile) dengan client portal.

---

## 1. Tech Stack (FINAL)

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Astro + React |
| Backend | Cloudflare Workers (Astro API Routes) |
| Database | Neon PostgreSQL + Prisma ORM |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 |
| Payment | Midtrans (QRIS) |
| Hosting | Cloudflare Pages |
| **Package Manager** | **pnpm** (Strict) |
| **Testing** | **Vitest** |

---

## 2. Roles

| Role | Akses |
|------|-------|
| **Admin** | Full access: manage clients, projects, blog, pages, templates |
| **Client** | Portal: dashboard, web saya, billing, akun saya |

---

## 3. Fitur

### 3.1 Public Site

| Halaman | Deskripsi |
|---------|-----------|
| Landing Page | Hero, layanan, CTA, testimoni |
| Layanan | 3 halaman: Web Sekolah, Web Berita, Company Profile |
| Template Gallery | Gambar + link ke demo (external URL) |
| Pricing | Paket harga |
| Blog | Artikel promosi |
| Register | Form pendaftaran client |
| Login | Form login untuk client/admin |

### 3.2 Client Portal

| Halaman | Deskripsi |
|---------|-----------|
| Dashboard | Ringkasan status proyek |
| Web Saya | List proyek dengan detail (status, URL, credentials) |
| Billing | Tagihan belum bayar, riwayat, bayar via QRIS |
| Akun Saya | Edit profil, ubah password |

### 3.3 Admin Panel

| Halaman | Deskripsi |
|---------|-----------|
| Dashboard | Overview semua client & proyek |
| Manage Client | CRUD client |
| Manage Project | Update status, tambah URL/credentials |
| Blog | CRUD artikel |
| Pages | CRUD halaman CMS |
| Templates | CRUD template (gambar + demo URL) |

---

## 4. Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(10) DEFAULT 'client', -- 'admin' | 'client'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'sekolah' | 'berita' | 'company'
  status VARCHAR(20) DEFAULT 'pending_payment',
  -- Status: pending_payment | in_progress | review | completed
  url VARCHAR(255),
  credentials JSONB, -- { "admin_url": "", "username": "", "password": "" }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(10) DEFAULT 'unpaid', -- 'unpaid' | 'paid'
  midtrans_order_id VARCHAR(255),
  qris_url TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL, -- 'sekolah' | 'berita' | 'company'
  image_url TEXT NOT NULL,
  demo_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  status VARCHAR(10) DEFAULT 'draft', -- 'draft' | 'published'
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CMS Pages
CREATE TABLE pages (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Project Status Flow

```
Order → pending_payment → (bayar) → in_progress → review → completed
```

| Status | Deskripsi |
|--------|-----------|
| `pending_payment` | Menunggu pembayaran |
| `in_progress` | Sedang dikerjakan |
| `review` | Menunggu review client |
| `completed` | Selesai (URL & credentials tersedia) |

---

## 6. API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Client Portal
```
GET  /api/projects          # List my projects
GET  /api/projects/:id      # Project detail
GET  /api/invoices          # My invoices
POST /api/invoices/:id/pay  # Create Midtrans payment
```

### Admin
```
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id

GET    /api/admin/projects
PUT    /api/admin/projects/:id

CRUD   /api/admin/posts
CRUD   /api/admin/pages
CRUD   /api/admin/templates
```

### Public
```
GET /api/templates
GET /api/posts
GET /api/pages/:slug
```

### Webhook
```
POST /api/webhooks/midtrans  # Payment notification
```

---

## 5. Recent Modular Architecture Updates (Current)

### Enhanced UI Component System ✅ (Dec 2025)
- **Form Components**: 
  - `Form.astro`: Reusable form wrapper with consistent spacing
  - `FormGroup.astro`: Input grouping with label/hint support and proper TypeScript interfaces
  - `FormInput.astro`: Standardized inputs with type safety and validation props
- **ProjectCard.astro**: Reusable project display component with status mapping
- **Impact**: Eliminated form duplication across 3+ pages, standardized project display

### Service Layer Expansion ✅ (Dec 2025)
- **`template.ts`**: Template filtering business logic extracted from inline JavaScript
- **`project.ts`**: Project status mapping and display utilities server-side support
- **`config.ts`**: Added `templateCategories` for centralized configuration management
- **`BaseCrudService`**: Generic admin CRUD logic for consistent API behavior
- **Improved Separation**: BusinessLogic → Services → Components → Pages

### Security & Optimization ✅ (Dec 2025)
- **Payment Security**: Midtrans SHA-512 signature validation and amount verification implemented.
- **Bot/DDoS Protection**: Fixed-window rate limiting for sensitive API routes.
- **Database Optimization**: Strategic indexes added to Prisma schema for dashboard performance.
- **Type Safety**: Middleware refactored for 100% type-safe `locals` access.


---

## 6. Biaya Bulanan

| Service | Biaya |
|---------|-------|
| Cloudflare | Gratis |
| Neon PostgreSQL | Gratis (3GB) |
| Midtrans | 2.9% per transaksi |
| **Total Fixed** | **Rp 0** |

---

## 8. Out of Scope (V1)

Fitur berikut **TIDAK** termasuk dalam V1:
- WhatsApp notification
- Real-time updates
- Ticket/support system
- CRM
- Complex RBAC (hanya admin/client)
- File versioning
- Multi-tenant organizations
