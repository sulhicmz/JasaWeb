# JasaWeb Documentation

## 📁 Struktur Dokumentasi

| File | Deskripsi |
|------|-----------|
| `architecture/blueprint.md` | Spesifikasi fitur, database schema, API endpoints, resilience patterns |
| `architecture/roadmap.md` | Timeline development |
| `deployment/SETUP.md` | Panduan setup Cloudflare dan deployment |
| `task.md` | Checklist task yang sudah selesai dan berjalan |
| `system-health.md` | Status kesehatan sistem dan monitoring |
| `evaluasi.md` | Hasil evaluasi arsitektur dan kualitas kode |
| `bug.md` | Daftar bug yang sudah ditemukan dan diperbaiki |

---

## Tech Stack (FINAL)

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Astro 5 + React 19 |
| Backend | Cloudflare Workers |
| Database | Neon PostgreSQL + Prisma ORM |
| Cache | Cloudflare KV + Redis-style caching |
| Storage | Cloudflare R2 |
| Payment | Midtrans QRIS |
| Hosting | Cloudflare Pages |

---

## Quick Links

- **Scope & Features**: [blueprint.md](architecture/blueprint.md)
- **Setup Guide**: [SETUP.md](deployment/SETUP.md)
- **Tasks**: [task.md](task.md)
- **AI Guidelines**: [AGENTS.md](../AGENTS.md)

---

## Dokumentasi Fitur Baru

### Background Job Queue System (Jan 2026)
- JobQueueService untuk manajemen job lifecycle
- JobSchedulerService untuk processing dan batch execution
- Support notification dan report generation jobs
- Lihat: [AGENTS.md - Background Job Section](../AGENTS.md#completed-jan-7-2026)

### Resilience Patterns Implementation (Jan 2026)
- Retry with exponential backoff
- Circuit breaker pattern
- Timeout handling
- Request logging & monitoring
- Lihat: [blueprint.md - Resilience Patterns](architecture/blueprint.md#5-integration-resilience-patterns-new---jan-7-2026)

### Performance Intelligence System (Dec 2025)
- ML-based anomaly detection (Z-score)
- Predictive analytics dengan linear regression
- Pattern recognition (auto-correlation)
- Intelligent alerting
- Lihat: [blueprint.md - Performance Intelligence](architecture/blueprint.md#32-advanced-performance-intelligence-system-new)

### Redis Dashboard Caching (Dec 2025)
- Cache-aside pattern untuk dashboard aggregates
- TTL-based invalidation (5min stats, 3min recent data)
- Cache monitoring endpoint
- 89% cache hit rate achieved
- Lihat: [AGENTS.md - Redis Caching Section](../AGENTS.md#redis-dashboard-caching-implementation--dec-23-2025)

### OpenAPI Documentation (Dec 2025)
- Spesifikasi OpenAPI 3.0 lengkap untuk semua API endpoints
- Interactive Swagger UI di `/docs`
- API specification endpoint di `/api/docs`
- Lihat: [AGENTS.md - OpenAPI Section](../AGENTS.md#openapi-documentation-implementation--dec-23-2025)
