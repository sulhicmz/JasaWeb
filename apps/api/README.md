# JasaWeb API Service

NestJS-based REST API for the JasaWeb client portal and internal operations.

## 🚀 Features

- **Authentication**: Email/password, magic links, JWT with refresh tokens
- **Multi-tenancy**: Organization-based data isolation
- **RBAC**: Role-based access control (Owner, Admin, Reviewer, Finance, Guest)
- **Modules**: Projects, Milestones, Files, Approvals, Tickets, Invoices
- **Security**: Rate limiting, CSRF protection, audit logging
- **Health Checks**: Database and HTTP connectivity monitoring

## 📁 Architecture

```
src/
├── auth/           # Authentication & authorization
├── common/         # Shared utilities and database
├── projects/       # Project management
├── milestones/     # Project milestones
├── files/          # File management with S3
├── approvals/      # Approval workflows
├── tickets/        # Support ticket system
├── invoices/       # Billing and invoices
├── users/          # User management
├── health/         # Health check endpoints
└── dashboard/      # Dashboard analytics
```

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run start:dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start:prod
```

## 📊 Endpoints

- **Health**: `GET /health`, `GET /health/database`, `GET /health/http`
- **Auth**: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`
- **API Documentation**: Available at `/api` when running

## 🔒 Security

- OWASP Top 10 compliant
- Multi-tenant data isolation
- Comprehensive audit logging
- Rate limiting and CORS protection
