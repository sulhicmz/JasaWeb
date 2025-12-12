# 🚀 Panduan Deployment JasaWeb

Dokumentasi lengkap untuk deployment aplikasi JasaWeb, termasuk konfigurasi database, environment variables, dan akses admin.

## 📋 Daftar Isi

- [Login Dashboard Admin](#-login-dashboard-admin)
- [Konfigurasi Database](#-konfigurasi-database)
- [Environment Variables](#-environment-variables)
- [Deployment Process](#-deployment-process)
- [Post-Deployment Checklist](#-post-deployment-checklist)

---

## 🔐 Login Dashboard Admin

### Kredensial Default

Setelah menjalankan database seeding (`pnpm db:seed`), sistem akan membuat akun admin default:

```
Email: admin@jasaweb.com
Password: admin123
```

> ⚠️ **PENTING**: Segera ubah password default ini setelah login pertama kali untuk keamanan!

### Cara Login

1. Akses halaman login: `http://localhost:4321/login` (development) atau `https://yourdomain.com/login` (production)
2. Masukkan email dan password admin
3. Klik tombol "Masuk"
4. Anda akan diarahkan ke dashboard admin

### Mengubah Password Admin

1. Login ke dashboard
2. Navigasi ke **Settings** → **Profile**
3. Klik **Change Password**
4. Masukkan password lama dan password baru
5. Simpan perubahan

### Membuat Admin Baru

Jika Anda ingin membuat admin baru secara manual:

```bash
# Masuk ke Prisma Studio
pnpm db:studio

# Atau gunakan script berikut untuk membuat user admin
```

---

## 🗄️ Konfigurasi Database

### Prerequisites

- **PostgreSQL** versi 15 atau lebih tinggi
- **Docker** dan **Docker Compose** (untuk development lokal)

### Setup Database Development

1. **Start Database dengan Docker Compose**

```bash
# Start PostgreSQL container
docker-compose up -d

# Verifikasi database berjalan
docker-compose ps
```

2. **Konfigurasi Connection String**

Edit file `.env` di root project:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/jasaweb
```

Format connection string:
```
postgresql://[user]:[password]@[host]:[port]/[database_name]
```

3. **Jalankan Database Migrations**

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database dengan data awal (termasuk admin user)
pnpm db:seed
```

### Setup Database Production

#### Opsi 1: Managed Database (Recommended)

Gunakan layanan managed database seperti:
- **Supabase** (PostgreSQL managed)
- **Neon** (Serverless PostgreSQL)
- **Railway** (PostgreSQL)
- **AWS RDS** (PostgreSQL)

Contoh connection string production:
```bash
DATABASE_URL=postgresql://user:password@db.example.com:5432/jasaweb_prod?sslmode=require
```

#### Opsi 2: Self-Hosted Database

1. Install PostgreSQL 15+ di server
2. Buat database baru:
```sql
CREATE DATABASE jasaweb_prod;
CREATE USER jasaweb_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE jasaweb_prod TO jasaweb_user;
```

3. Update connection string di environment variables

### Database Maintenance

```bash
# Reset database (⚠️ DANGER: Menghapus semua data!)
pnpm db:reset

# Buka Prisma Studio untuk management GUI
pnpm db:studio

# Backup database
pg_dump -U postgres jasaweb > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres jasaweb < backup_20250112.sql
```

---

## ⚙️ Environment Variables

### File Environment

Proyek ini menggunakan 3 file environment:

1. **Root `.env`** - Konfigurasi global
2. **`apps/api/.env`** - Konfigurasi API/Backend
3. **`apps/web/.env`** - Konfigurasi Web/Frontend

### Template Environment Variables

Gunakan file `.env.example` sebagai template:

```bash
# Copy template ke file .env
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Environment Variables Wajib

#### 1. Database Configuration

```bash
# PostgreSQL Connection String
DATABASE_URL=postgresql://user:password@host:port/database

# Contoh Development
DATABASE_URL=postgresql://postgres:password@localhost:5432/jasaweb

# Contoh Production (dengan SSL)
DATABASE_URL=postgresql://user:pass@db.example.com:5432/jasaweb_prod?sslmode=require
```

#### 2. Authentication & Security

```bash
# JWT Secret Keys (HARUS minimal 32 karakter!)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_random_string
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters_long_random_string

# Session Secret
SESSION_SECRET=your_session_secret_minimum_32_characters_long_random_string

# Bcrypt Rounds (10-12 recommended)
BCRYPT_ROUNDS=12
```

> 🔒 **Cara Generate Secret yang Aman:**
```bash
# Menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Menggunakan OpenSSL
openssl rand -hex 32
```

#### 3. Application Configuration

```bash
# Environment Mode
NODE_ENV=production  # atau 'development'

# Port Configuration
PORT=4321           # Web application port
API_PORT=3000       # API port

# CORS Origin
CORS_ORIGIN=https://yourdomain.com  # atau http://localhost:4321 untuk dev
```

#### 4. Email Configuration (Optional)

```bash
# SMTP Settings untuk email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

#### 5. Storage Configuration (Optional)

```bash
# S3-Compatible Storage
S3_BUCKET=jasaweb-storage
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

### Environment Variables untuk Frontend (Vite)

Untuk aplikasi web (Astro/Vite), tambahkan di `apps/web/.env`:

```bash
# Public variables (dapat diakses di client-side)
PUBLIC_API_URL=https://api.yourdomain.com
PUBLIC_SITE_URL=https://yourdomain.com

# Private variables (hanya di server-side)
VITE_API_KEY=your_api_key_here
```

> ℹ️ **Catatan**: Variabel yang dimulai dengan `PUBLIC_` dapat diakses di client-side. Jangan taruh secret di sini!

### Validasi Environment Variables

Sistem memiliki validasi otomatis untuk environment variables. Lihat file:
- `apps/api/src/common/config/env.validation.ts`

Jika ada environment variable yang tidak valid, aplikasi akan gagal start dengan error message yang jelas.

---

## 🚀 Deployment Process

### Deployment ke Cloudflare Pages

#### Prerequisites

- Akun Cloudflare
- Repository GitHub yang sudah terhubung

#### Langkah-langkah Deployment

1. **Login ke Cloudflare Dashboard**
   - Buka https://dash.cloudflare.com
   - Pilih **Pages** dari sidebar

2. **Buat Project Baru**
   - Klik **Create a project**
   - Pilih **Connect to Git**
   - Pilih repository `JasaWeb`

3. **Konfigurasi Build Settings**

```yaml
Build command: pnpm build:web
Build output directory: apps/web/dist
Root directory: /
Node version: 20
```

4. **Set Environment Variables**

Di Cloudflare Pages dashboard, tambahkan environment variables:

```bash
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
SESSION_SECRET=your_production_session_secret
CORS_ORIGIN=https://yourdomain.com
```

5. **Deploy**
   - Klik **Save and Deploy**
   - Tunggu proses build selesai
   - Aplikasi akan tersedia di URL yang diberikan Cloudflare

#### Custom Domain

1. Di Cloudflare Pages dashboard, pilih project Anda
2. Klik **Custom domains**
3. Tambahkan domain Anda
4. Update DNS records sesuai instruksi

### Deployment ke Platform Lain

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... tambahkan semua environment variables
```

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Set environment variables via dashboard
```

#### Docker Deployment

```bash
# Build image
docker build -t jasaweb:latest .

# Run container
docker run -d \
  -p 4321:4321 \
  -e DATABASE_URL=your_db_url \
  -e JWT_SECRET=your_secret \
  --name jasaweb \
  jasaweb:latest
```

### Automated Deployment (CI/CD)

Proyek ini sudah dilengkapi dengan GitHub Actions untuk automated deployment.

File workflow: `.github/workflows/deploy.yml`

**Deployment Otomatis:**
- Push ke branch `develop` → Deploy ke Development
- Push ke branch `main` → Deploy ke Staging
- Create release tag → Deploy ke Production

---

## ✅ Post-Deployment Checklist

Setelah deployment, pastikan hal-hal berikut:

### 1. Database

- [ ] Database migrations berhasil dijalankan
- [ ] Database seeding berhasil (jika diperlukan)
- [ ] Connection pooling dikonfigurasi dengan benar
- [ ] Backup otomatis sudah disetup

### 2. Security

- [ ] Password admin default sudah diubah
- [ ] JWT secrets menggunakan nilai yang aman (min 32 karakter)
- [ ] HTTPS/SSL sudah aktif
- [ ] CORS origin sudah dikonfigurasi dengan benar
- [ ] Rate limiting sudah aktif
- [ ] Security headers sudah dikonfigurasi

### 3. Functionality

- [ ] Login admin berfungsi dengan baik
- [ ] API endpoints dapat diakses
- [ ] File upload berfungsi (jika menggunakan storage)
- [ ] Email notifications berfungsi (jika diaktifkan)
- [ ] Form submissions berfungsi

### 4. Performance

- [ ] Page load time < 3 detik
- [ ] API response time < 200ms
- [ ] Database query optimization
- [ ] CDN sudah dikonfigurasi (jika diperlukan)
- [ ] Caching sudah aktif

### 5. Monitoring

- [ ] Error tracking sudah disetup (Sentry, LogRocket, dll)
- [ ] Application monitoring aktif
- [ ] Uptime monitoring aktif
- [ ] Alert notifications dikonfigurasi

### 6. Documentation

- [ ] API documentation tersedia
- [ ] User guide tersedia
- [ ] Admin guide tersedia
- [ ] Deployment runbook tersedia

---

## 🆘 Troubleshooting

### Database Connection Error

```bash
# Error: Can't reach database server
# Solusi:
1. Cek DATABASE_URL sudah benar
2. Pastikan database server berjalan
3. Cek firewall/security group settings
4. Verifikasi credentials
```

### Build Error

```bash
# Error: Build failed
# Solusi:
1. Cek semua environment variables sudah diset
2. Jalankan `pnpm install` untuk update dependencies
3. Clear build cache: `pnpm clean`
4. Cek Node.js version (harus 20+)
```

### Login Error

```bash
# Error: Invalid credentials
# Solusi:
1. Pastikan database seeding sudah dijalankan
2. Cek email: admin@jasaweb.com
3. Cek password: admin123
4. Reset password via database jika perlu
```

### Environment Variables Not Loading

```bash
# Solusi:
1. Pastikan file .env ada di root directory
2. Restart development server
3. Untuk production, set via platform dashboard
4. Cek validasi di env.validation.ts
```

---

## 📚 Resources

- [README.md](../README.md) - Project overview
- [SECURITY.md](../SECURITY.md) - Security guidelines
- [API Documentation](./api-endpoints.md) - API reference
- [Client Management System](./client-management-system.md) - System documentation

---

## 🤝 Support

Jika mengalami masalah:

1. Cek [Troubleshooting](#-troubleshooting) di atas
2. Baca dokumentasi lengkap di folder `docs/`
3. Buka issue di GitHub repository
4. Hubungi tim development

---

**Terakhir diupdate**: 2025-12-12
**Versi**: 1.0.0
