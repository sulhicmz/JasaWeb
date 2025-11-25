# JasaWeb Enterprise Client Management System - Consolidated Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Core Features](#core-features)
4. [API Reference](#api-reference)
5. [Security Practices](#security-practices)
6. [Development Workflow](#development-workflow)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Optimization](#optimization)

---

## System Overview

### Purpose

The JasaWeb Enterprise Client Management System is a comprehensive platform designed to streamline web development service delivery for schools, news portals, and company profiles. It provides a unified solution for managing client relationships, projects, approvals, billing, and support.

### Key Objectives

- **Lead Generation**: Generate qualified leads with 5-8% conversion rate from landing page to contact form
- **Client Collaboration**: Accelerate client collaboration through integrated Client Portal
- **Standardized Delivery**: Reduce project cycle time to 8-10 weeks through standardized processes
- **Client Satisfaction**: Achieve NPS score ≥ 8/10
- **Support Excellence**: Maintain SLA response time ≤ 4 hours during business hours

### Target Users

#### External Users (Clients)

- **Organization Owner**: Full access to organization resources
- **Organization Admin**: Manage users and projects
- **Finance**: Handle billing and payments
- **Reviewer/Stakeholder**: Review and approve deliverables
- **Guest**: Read-only access to specific resources

#### Internal Users (Team)

- **Project Manager**: Oversee project delivery
- **Designer**: Create and manage design assets
- **Developer**: Implement features and fixes
- **Support**: Handle client tickets and issues
- **Finance**: Manage invoicing and payments
- **Super Admin**: System-wide administration

---

## Architecture & Technology Stack

### Technology Stack

#### Frontend

- **Framework**: Astro 4.0+ (Marketing Site)
- **Styling**: Tailwind CSS 4.1+ (with native Vite plugin)
- **Components**: Custom component library
- **State Management**: Native Astro state management
- **Forms**: Zod schema validation

#### Backend

- **Framework**: NestJS 10.0+
- **Language**: TypeScript 5.0+
- **API Style**: RESTful with OpenAPI/Swagger documentation
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-Based Access Control (RBAC)

#### Database

- **Primary Database**: PostgreSQL 15+
- **ORM**: Prisma 6.16+
- **Multi-tenancy**: Organization-based data isolation
- **Caching**: Redis (optional)
- **Search**: PostgreSQL full-text search

#### Infrastructure

- **Package Manager**: pnpm 8.15+
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errors), OpenTelemetry (traces)
- **Storage**: S3-compatible object storage

### Monorepo Structure

```
jasaweb/
├── apps/
│   ├── web/              # Marketing website (Astro)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   └── styles/
│   │   └── public/
│   │
│   └── api/              # Backend API (NestJS)
│       ├── src/
│       │   ├── auth/     # Authentication module
│       │   ├── users/    # User management
│       │   ├── projects/ # Project management
│       │   ├── files/    # File management
│       │   ├── approvals/# Approval workflow
│       │   ├── tickets/  # Support tickets
│       │   ├── invoices/ # Billing & invoicing
│       │   ├── milestones/# Project milestones
│       │   └── common/   # Shared utilities
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── ui/               # Shared UI components
│   ├── config/           # Shared configurations
│   └── testing/          # Testing utilities
│
├── docs/                 # Documentation
├── tests/                # Integration & E2E tests
└── scripts/              # Utility scripts
```

---

## Core Features

### 1. Organization Management

#### Features

- Multi-organization support
- Organization settings and preferences
- Billing configuration
- Custom branding (future)

#### Key Operations

```typescript
// Create organization
POST /api/organizations
{
  "name": "Acme Corporation",
  "billingEmail": "billing@acme.com",
  "plan": "enterprise"
}

// Update organization settings
PATCH /api/organizations/:id
{
  "settings": {
    "timezone": "Asia/Jakarta",
    "language": "id",
    "notifications": {
      "email": true,
      "inApp": true
    }
  }
}
```

### 2. User & Membership Management

#### Features

- User registration and authentication
- Role-based access control
- Multi-organization membership
- User invitations
- Profile management

#### User Roles

| Role         | Permissions                      | Use Case             |
| ------------ | -------------------------------- | -------------------- |
| **Owner**    | Full access to organization      | Organization founder |
| **Admin**    | Manage users, projects, settings | Team lead            |
| **Finance**  | View/manage invoices, payments   | Accounting team      |
| **Reviewer** | Review and approve deliverables  | Stakeholders         |
| **Member**   | View assigned projects           | Team members         |
| **Guest**    | Read-only access                 | External reviewers   |

### 3. Project Management

#### Features

- Project creation and tracking
- Status management (draft, progress, review, completed, paused, cancelled)
- Timeline and deadline tracking
- Project statistics and metrics
- Multi-view support (summary/detail)

#### Key Operations

```typescript
// Create project
POST /api/projects
{
  "name": "School Website Redesign",
  "status": "draft",
  "startAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-03-01T00:00:00Z"
}

// Get project with statistics
GET /api/projects/:id/stats
Response:
{
  "milestoneCount": 5,
  "completedMilestones": 3,
  "fileCount": 24,
  "pendingApprovals": 2,
  "taskCount": 15,
  "completedTasks": 10,
  "progress": 60
}

// List projects (summary view)
GET /api/projects?view=summary

// List projects (detailed view)
GET /api/projects?view=detail
```

### 4. File Management

#### Features

- File upload and storage
- Version control
- Folder organization
- File preview (images, PDFs)
- Access control
- Checksum verification

#### Supported File Types

- **Documents**: PDF, DOC, DOCX, XLS, XLSX
- **Images**: JPG, PNG, GIF, SVG, WEBP
- **Design**: PSD, AI, SKETCH, FIGMA (links)
- **Archives**: ZIP, RAR, 7Z

### 5. Approval Workflow

#### Features

- Multi-stage approval process
- Comment and feedback system
- Approval history and audit trail
- Email notifications
- Timestamp and digital signature

#### Approval Types

- **Design**: UI/UX designs, mockups
- **Content**: Copy, images, videos
- **Feature**: New functionality
- **Page**: Complete page layouts
- **Deployment**: Production releases

### 6. Support Ticket System

#### Features

- Ticket creation and tracking
- Priority management (low, medium, high, critical)
- SLA tracking
- Assignment and routing
- Status workflow
- Resolution tracking

#### SLA Targets

| Priority     | Response Time | Resolution Time |
| ------------ | ------------- | --------------- |
| **Critical** | 1 hour        | 4 hours         |
| **High**     | 4 hours       | 24 hours        |
| **Medium**   | 8 hours       | 3 days          |
| **Low**      | 24 hours      | 7 days          |

### 7. Invoice & Payment Management

#### Features

- Invoice generation
- Payment tracking
- Multiple payment methods
- Payment history
- Receipt generation
- Milestone-based billing

#### Invoice States

- **Draft**: Being prepared
- **Issued**: Sent to client
- **Paid**: Payment received
- **Overdue**: Past due date
- **Cancelled**: Voided

---

## API Reference

### Base URL

```
Development: http://localhost:3000/api
Staging: https://staging-api.jasaweb.com/api
Production: https://api.jasaweb.com/api
```

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer {accessToken}
```

### Authentication Endpoints

#### POST /auth/login

Authenticate and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Projects Endpoints

#### GET /projects

List all projects for the current organization.

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `view` (optional): `summary` (default) or `detail`
- `status` (optional): Filter by status (draft, progress, review, completed, paused, cancelled)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200) - Summary View:**
```json
{
  "items": [
    {
      "id": "project-123",
      "name": "School Website Redesign",
      "status": "progress",
      "startAt": "2025-01-01T00:00:00Z",
      "dueAt": "2025-03-01T00:00:00Z",
      "organizationId": "org-123",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-06T10:00:00Z",
      "_count": {
        "milestones": 5,
        "files": 24,
        "approvals": 3,
        "tasks": 15,
        "tickets": 2,
        "invoices": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### GET /projects/:id/stats

Get project statistics.

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "milestoneCount": 5,
  "completedMilestones": 3,
  "fileCount": 24,
  "pendingApprovals": 2,
  "taskCount": 15,
  "completedTasks": 10,
  "progress": 60
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

---

## Security Practices

### Authentication Security

#### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Data Protection

#### Encryption at Rest

- Database encryption (PostgreSQL)
- File storage encryption (S3 SSE)
- Backup encryption

#### Encryption in Transit

- HTTPS/TLS 1.3
- Certificate pinning
- Secure WebSocket connections

### Access Control

#### Role-Based Access Control (RBAC)

```typescript
// Role guard decorator
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler()
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage in controller
@Controller('projects')
export class ProjectsController {
  @Post()
  @Roles('owner', 'admin')
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }
}
```

### Security Best Practices

#### Input Validation

```typescript
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  status: z.enum(['draft', 'progress', 'review', 'completed']),
  startAt: z.date().optional(),
  dueAt: z.date().optional(),
});
```

#### SQL Injection Prevention

- Use Prisma ORM (parameterized queries)
- Input sanitization
- Prepared statements

#### XSS Prevention

- Content Security Policy (CSP)
- Output encoding
- HTML sanitization

#### CSRF Protection

- CSRF tokens
- SameSite cookies
- Origin validation

### Security Checklist

- [ ] All endpoints require authentication
- [ ] RBAC implemented for all resources
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (CSP, sanitization)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] Secrets stored securely
- [ ] Audit logging enabled

---

## Development Workflow

### Core Principles

- **Speed over perfection** - Ship fast, iterate quickly
- **Essential over comprehensive** - Do what matters, skip what doesn't
- **Automation over manual** - Automate repetitive tasks
- **Communication over documentation** - Talk to each other

### Daily Workflow

#### Morning Setup (5 minutes)
```bash
# 1. Get latest code
git checkout main
git pull origin main

# 2. Check for any issues
git log --oneline -5  # Recent commits

# 3. Start your work
git checkout -b feature/your-task
```

#### Before End of Day (2 minutes)
```bash
# Push your work
git push origin feature/your-task

# Create/update PR if ready
# Add "WIP" if not ready
```

### Pull Request Process

#### PR Types
- **🚀 Feature** - New functionality
- **🐛 Bugfix** - Fixing issues
- **♻️ Refactor** - Code improvements
- **📝 Docs** - Documentation updates
- **🔧 Config** - Configuration changes

#### PR Review Process
1. **Create PR** with clear description
2. **Self-review** your own changes first
3. **Request review** from 1-2 team members
4. **Address feedback** quickly
5. **Merge** when approved

### Development Commands

#### Quick Start
```bash
# Install dependencies (once)
pnpm install

# Start development
pnpm dev

# Run tests (quick)
pnpm test:quick
```

#### Before Commit
```bash
# Quick validation (30 seconds)
pnpm lint && pnpm typecheck && pnpm test:quick

# Full validation (2 minutes)
pnpm lint && pnpm typecheck && pnpm test:run && pnpm build
```

### Efficiency Tips

#### Work Habits
- **Pomodoro technique**: 25min work, 5min break
- **Time blocking**: Focus on one task at a time
- **Deep work**: Minimize distractions
- **Early feedback**: Share work early

#### Code Habits
- **Small commits**: Easier to review and revert
- **Clear messages**: Explain why, not what
- **Consistent style**: Use automated formatting
- **Delete code**: Remove unused code

---

## Deployment

### Environment Setup

#### Development

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# Start database
docker-compose up -d postgres

# Run migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Cloudflare Pages Deployment

#### Build Settings

- **Build command**: `pnpm build:web`
- **Build output directory**: `apps/web/dist`
- **Root directory**: `/` (default)

#### Environment Variables

The following environment variables should be set in the Cloudflare Pages dashboard:

```bash
# Site Configuration
SITE_URL=https://your-domain.com
SITE_NAME=JasaWeb
SITE_DESCRIPTION=Professional Web Development Services

# Analytics (optional)
GOOGLE_ANALYTICS_ID=
GOOGLE_TAG_MANAGER_ID=

# Contact Form
CONTACT_EMAIL=contact@jasaweb.com
```

### Docker Deployment

#### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jasaweb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - '4321:4321'
    depends_on:
      - api

volumes:
  postgres_data:
```

### Health Checks

```typescript
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };
  }
}
```

---

## Troubleshooting

### Common Issues

#### Build Failures

Common causes of build failures:
1. **Dependency issues**: Ensure all dependencies are properly listed in `package.json`
2. **Environment variables**: Check that all required environment variables are set
3. **Build command**: Verify the build command is correct (`pnpm build:web`)

#### Performance Issues

To optimize performance:
1. Use Cloudflare's automatic asset optimization
2. Enable Brotli compression
3. Configure proper caching headers
4. Use Cloudflare's image optimization for images

### Debugging Process

#### Quick Debug Steps
1. **Check console** for errors
2. **Check network** tab for API issues
3. **Run locally** with debug flags
4. **Add console.log** for quick debugging
5. **Use debugger** for complex issues

### Troubleshooting Commands

```bash
# Run security audit
pnpm security:audit

# Check for hardcoded secrets
grep -r "password\|secret\|key" --include="*.ts" --include="*.js" .

# Review dependencies
pnpm outdated

# Run dependency audit
npm audit --audit-level=moderate
```

---

## Optimization

### Database Optimization

#### Query Optimization

```typescript
// Use select to fetch only needed fields
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    _count: {
      select: {
        milestones: true,
        files: true,
      },
    },
  },
});

// Use aggregations for metrics
const stats = await prisma.project.aggregate({
  where: { organizationId },
  _count: true,
  _avg: { progress: true },
});
```

#### Connection Pooling

```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  connection_limit = 10
  pool_timeout = 20
}
```

### API Performance

#### Response Time Targets

- **Health Check**: < 50ms
- **List Endpoints**: < 200ms
- **Detail Endpoints**: < 150ms
- **Create/Update**: < 300ms
- **File Upload**: < 2s (depends on size)

#### Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
export class AppModule {}
```

### Frontend Performance

#### Performance Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1

---

**Last Updated**: 2025-11-23
**Version**: 1.0.0
**Maintained by**: JasaWeb Team
