# 🏢 JasaWeb Client Management System

## 🎯 Purpose

A unified platform for managing web development services (School Websites, News Portals, Company Profiles) with integrated client portal for streamlined collaboration.

> **⚠️ NOTE**: This document complements `blueprint.md` which contains the detailed project roadmap and technical specifications. This document focuses on the client management aspects and user workflows.

---

## 📊 Success Metrics

- **Landing → Lead**: 5-8% conversion
- **Lead → Deal**: ≥ 30% conversion
- **Project Duration**: 8-10 weeks average
- **Client Satisfaction**: NPS ≥ 8/10
- **Support SLA**: ≤ 4 hour response

---

## 🏗️ System Architecture

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

### Multi-Tenancy Architecture

The system implements organization-based multi-tenancy:

```typescript
// Automatic tenant isolation
@Injectable()
export class MultiTenantPrismaService {
  constructor(private prisma: PrismaClient) {}

  // All queries automatically filtered by organizationId
  async findMany(model: string, args: any) {
    const organizationId = this.getCurrentOrganizationId();
    return this.prisma[model].findMany({
      ...args,
      where: {
        ...args.where,
        organizationId,
      },
    });
  }
}
```

**Benefits:**

- Data isolation between organizations
- Simplified queries (no manual filtering)
- Enhanced security
- Scalable architecture

---

## 🚀 Core Features

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

#### Key Operations

```typescript
// Upload file
POST /api/projects/:projectId/files
Content-Type: multipart/form-data
{
  "file": <binary>,
  "folder": "designs/homepage",
  "version": "1.0"
}

// List files
GET /api/projects/:projectId/files?folder=designs

// Download file
GET /api/files/:id/download
```

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

#### Key Operations

```typescript
// Request approval
POST /api/projects/:projectId/approvals
{
  "itemType": "design",
  "itemId": "homepage-mockup-v2",
  "note": "Please review the updated homepage design"
}

// Approve/Reject
PATCH /api/approvals/:id
{
  "status": "approved",
  "note": "Looks great! Approved for implementation."
}

// Get approval history
GET /api/approvals/:id/history
```

### 6. Support Ticket System

#### Features

- Ticket creation and tracking
- Priority management (low, medium, high, critical)
- SLA tracking
- Assignment and routing
- Status workflow
- Resolution tracking

#### Ticket Types

- **Bug**: Software defects
- **Feature**: Feature requests
- **Improvement**: Enhancement suggestions
- **Question**: General inquiries
- **Task**: Action items

#### SLA Targets

| Priority     | Response Time | Resolution Time |
| ------------ | ------------- | --------------- |
| **Critical** | 1 hour        | 4 hours         |
| **High**     | 4 hours       | 24 hours        |
| **Medium**   | 8 hours       | 3 days          |
| **Low**      | 24 hours      | 7 days          |

#### Key Operations

```typescript
// Create ticket
POST /api/tickets
{
  "type": "bug",
  "priority": "high",
  "title": "Login page not loading",
  "description": "Users cannot access the login page",
  "projectId": "project-123"
}

// Update ticket
PATCH /api/tickets/:id
{
  "status": "in-progress",
  "assigneeId": "support-user-456"
}

// Resolve ticket
PATCH /api/tickets/:id/resolve
{
  "resolution": "Fixed authentication service configuration",
  "status": "resolved"
}
```

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

#### Key Operations

```typescript
// Create invoice
POST /api/invoices
{
  "projectId": "project-123",
  "amount": 5000000,
  "currency": "IDR",
  "issuedAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-01-15T00:00:00Z",
  "status": "issued"
}

// Record payment
POST /api/invoices/:id/payments
{
  "amount": 5000000,
  "gateway": "bank_transfer",
  "reference": "TRX-20250101-001",
  "paidAt": "2025-01-05T10:30:00Z"
}

// Download invoice
GET /api/invoices/:id/download
```

### 8. Audit Logging

#### Features

- Comprehensive activity tracking
- User action logging
- Security audit trail
- Compliance reporting
- Searchable logs

#### Logged Actions

- User authentication (login, logout, failed attempts)
- File operations (upload, download, delete)
- Approval actions (request, approve, reject)
- Payment transactions
- User management (create, update, delete)
- Settings changes

#### Key Operations

```typescript
// Query audit logs
GET /api/audit-logs?action=file_upload&startDate=2025-01-01

// Get user activity
GET /api/audit-logs/user/:userId

// Get organization activity
GET /api/audit-logs/organization/:orgId
```

---

## 👥 User Roles & Permissions

### Permission Matrix

| Feature             | Owner | Admin | Finance | Reviewer | Member | Guest |
| ------------------- | ----- | ----- | ------- | -------- | ------ | ----- |
| **Organization**    |
| View organization   | ✅    | ✅    | ✅      | ✅       | ✅     | ✅    |
| Update settings     | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| Delete organization | ✅    | ❌    | ❌      | ❌       | ❌     | ❌    |
| **Users**           |
| View users          | ✅    | ✅    | ✅      | ✅       | ✅     | ❌    |
| Invite users        | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| Update roles        | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| Remove users        | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| **Projects**        |
| View projects       | ✅    | ✅    | ✅      | ✅       | ✅     | ✅    |
| Create projects     | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| Update projects     | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| Delete projects     | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| **Files**           |
| View files          | ✅    | ✅    | ✅      | ✅       | ✅     | ✅    |
| Upload files        | ✅    | ✅    | ❌      | ✅       | ✅     | ❌    |
| Delete files        | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| **Approvals**       |
| View approvals      | ✅    | ✅    | ✅      | ✅       | ✅     | ✅    |
| Request approval    | ✅    | ✅    | ❌      | ✅       | ✅     | ❌    |
| Approve/Reject      | ✅    | ✅    | ❌      | ✅       | ❌     | ❌    |
| **Tickets**         |
| View tickets        | ✅    | ✅    | ✅      | ✅       | ✅     | ✅    |
| Create tickets      | ✅    | ✅    | ✅      | ✅       | ✅     | ❌    |
| Update tickets      | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |
| **Invoices**        |
| View invoices       | ✅    | ✅    | ✅      | ❌       | ❌     | ❌    |
| Create invoices     | ✅    | ✅    | ✅      | ❌       | ❌     | ❌    |
| Record payments     | ✅    | ✅    | ✅      | ❌       | ❌     | ❌    |
| **Audit Logs**      |
| View logs           | ✅    | ✅    | ❌      | ❌       | ❌     | ❌    |

### Implementing RBAC

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

---

## 📊 Data Models

### Core Models

#### User

```prisma
model User {
  id             String         @id @default(cuid())
  email          String         @unique
  name           String?
  password       String
  profilePicture String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  // Relations
  memberships    Membership[]
  approvals      Approval[]
  tickets        Ticket[]
  invoices       Invoice[]
  auditLogs      AuditLog[]
  files          File[]
  tasks          Task[]
  refreshTokens  RefreshToken[]
  sessions       Session[]
}
```

#### Organization

```prisma
model Organization {
  id           String       @id @default(cuid())
  name         String
  billingEmail String
  plan         String?
  settings     Json?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // Relations
  memberships  Membership[]
  projects     Project[]
  tickets      Ticket[]
  invoices     Invoice[]
  auditLogs    AuditLog[]
}
```

#### Project

```prisma
model Project {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  status         String
  startAt        DateTime?
  dueAt          DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id])
  milestones     Milestone[]
  files          File[]
  approvals      Approval[]
  tasks          Task[]
  tickets        Ticket[]
  invoices       Invoice[]
}
```

### Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_org ON memberships(organization_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Composite indexes
CREATE INDEX idx_projects_org_status ON projects(organization_id, status);
CREATE INDEX idx_tickets_org_status ON tickets(organization_id, status);
```

---

## 🔌 API Reference

### Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Jane Smith"
}

Response 201:
{
  "id": "user-456",
  "email": "newuser@example.com",
  "name": "Jane Smith"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Projects

#### List Projects

```http
GET /api/projects?view=summary&status=progress
Authorization: Bearer {accessToken}

Response 200:
[
  {
    "id": "project-123",
    "name": "School Website",
    "status": "progress",
    "startAt": "2025-01-01T00:00:00Z",
    "dueAt": "2025-03-01T00:00:00Z",
    "_count": {
      "milestones": 5,
      "files": 24,
      "approvals": 3,
      "tasks": 15,
      "tickets": 2,
      "invoices": 1
    }
  }
]
```

#### Create Project

```http
POST /api/projects
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "News Portal Redesign",
  "status": "draft",
  "startAt": "2025-02-01T00:00:00Z",
  "dueAt": "2025-04-01T00:00:00Z"
}

Response 201:
{
  "id": "project-789",
  "name": "News Portal Redesign",
  "status": "draft",
  "organizationId": "org-123",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

#### Get Project Statistics

```http
GET /api/projects/project-123/stats
Authorization: Bearer {accessToken}

Response 200:
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

```http
// 400 Bad Request
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

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid credentials"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Project with ID project-999 not found"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## 🎨 Client Portal Features

### Dashboard

#### Overview Widgets

- **Project Status**: Current project progress and milestones
- **Open Tickets**: Recent support tickets requiring attention
- **Pending Approvals**: Items awaiting review
- **Invoices**: Outstanding payments and billing status
- **Quick Links**: Staging, production, documentation
- **Activity Feed**: Recent project activities

#### Metrics Display

```typescript
interface DashboardMetrics {
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  tickets: {
    open: number;
    inProgress: number;
    resolved: number;
  };
  approvals: {
    pending: number;
    approved: number;
    rejected: number;
  };
  invoices: {
    outstanding: number;
    overdue: number;
    paid: number;
  };
}
```

### Project View

#### Project Details

- Project information and timeline
- Milestone progress tracker
- Team members and roles
- Recent activity log
- File browser
- Approval queue

#### Timeline View

```typescript
interface ProjectTimeline {
  milestones: Array<{
    id: string;
    title: string;
    dueAt: Date;
    status: 'todo' | 'in-progress' | 'completed' | 'overdue';
    progress: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    assignee: string;
    status: string;
    dueAt: Date;
  }>;
}
```

### File Management

#### Features

- Drag-and-drop upload
- Folder organization
- File preview
- Version history
- Download/share
- Search and filter

#### File Browser Interface

```typescript
interface FileBrowser {
  currentFolder: string;
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    version: string;
    uploadedBy: string;
    uploadedAt: Date;
    thumbnail?: string;
  }>;
  breadcrumbs: string[];
  actions: {
    upload: () => void;
    createFolder: () => void;
    download: (fileId: string) => void;
    delete: (fileId: string) => void;
  };
}
```

### Approval Center

#### Features

- Pending approvals list
- Approval history
- Comment and feedback
- Side-by-side comparison
- Batch approval (future)

#### Approval Interface

```typescript
interface ApprovalItem {
  id: string;
  type: 'design' | 'content' | 'feature' | 'page';
  title: string;
  description: string;
  attachments: File[];
  requestedBy: User;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  comments: Comment[];
  actions: {
    approve: (note?: string) => void;
    reject: (reason: string) => void;
    comment: (text: string) => void;
  };
}
```

### Support Center

#### Features

- Create support tickets
- Track ticket status
- View ticket history
- Add comments and attachments
- Rate support quality

#### Ticket Interface

```typescript
interface SupportTicket {
  id: string;
  type: 'bug' | 'feature' | 'question' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  attachments: File[];
  assignee?: User;
  slaDueAt: Date;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
  resolution?: string;
}
```

### Billing Center

#### Features

- View invoices
- Payment history
- Download receipts
- Payment methods
- Billing information

#### Invoice Display

```typescript
interface Invoice {
  id: string;
  number: string;
  project: Project;
  amount: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  payments: Payment[];
  actions: {
    download: () => void;
    pay: () => void;
  };
}
```

---

## 🔒 Security & Compliance

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

#### JWT Configuration

```typescript
export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};
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

#### Multi-Factor Authentication (Future)

- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification
- Backup codes

#### Session Management

```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
  revokedAt?: Date;
}
```

### Compliance

#### GDPR Compliance

- Data minimization
- Right to access
- Right to erasure
- Data portability
- Consent management

#### Indonesian Data Protection (UU PDP)

- Data localization
- Consent requirements
- Data breach notification
- Privacy policy

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

---

## ⚡ Performance Optimization

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

#### Caching Strategy

```typescript
// Redis caching example
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedProject(id: string) {
  const cached = await redis.get(`project:${id}`);
  if (cached) return JSON.parse(cached);

  const project = await prisma.project.findUnique({ where: { id } });
  await redis.setex(`project:${id}`, 3600, JSON.stringify(project));

  return project;
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

#### Pagination

```typescript
interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function findPaginated(params: PaginationParams) {
  const { page, limit, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
    }),
    prisma.project.count(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Frontend Performance

#### Asset Optimization

- Image optimization (WebP, AVIF)
- Code splitting
- Lazy loading
- CDN delivery

#### Performance Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1

---

## 🚀 Deployment Guide

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

#### Staging

```bash
# Build applications
pnpm build

# Run database migrations
pnpm db:migrate:deploy

# Start applications
pnpm start
```

#### Production

```bash
# Build for production
NODE_ENV=production pnpm build

# Run migrations
NODE_ENV=production pnpm db:migrate:deploy

# Start with PM2
pm2 start ecosystem.config.js
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

## 📚 Best Practices

### Code Organization

#### Module Structure

```
feature/
├── dto/
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── feature-response.dto.ts
├── entities/
│   └── feature.entity.ts
├── feature.controller.ts
├── feature.service.ts
├── feature.module.ts
└── feature.service.spec.ts
```

#### Naming Conventions

- **Files**: kebab-case (e.g., `project-service.ts`)
- **Classes**: PascalCase (e.g., `ProjectService`)
- **Functions**: camelCase (e.g., `createProject`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IProject`)

### Error Handling

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

### Testing Strategy

#### Unit Tests

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProjectService, PrismaService],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create project', async () => {
    const dto = { name: 'Test Project' };
    const result = await service.create(dto, 'org-123');

    expect(result.name).toBe(dto.name);
    expect(result.organizationId).toBe('org-123');
  });
});
```

#### Integration Tests

```typescript
describe('Projects API', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    token = response.body.accessToken;
  });

  it('should create and retrieve project', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project' })
      .expect(201);

    const projectId = createResponse.body.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.name).toBe('Test Project');
  });
});
```

### Documentation

#### API Documentation

```typescript
@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }
}
```

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
- [ ] Regular security updates
- [ ] Dependency scanning

---

## 📞 Support & Resources

### Documentation

- [API Documentation](http://localhost:3000/api/docs)
- [Testing Strategy](./testing-strategy.md)
- [Optimization Plan](./optimization-plan.md)
- [Project Roadmap](./roadmap.md)

### Community

- [GitHub Issues](https://github.com/sulhicmz/JasaWeb/issues)
- [GitHub Discussions](https://github.com/sulhicmz/JasaWeb/discussions)
- [Email Support](mailto:support@jasaweb.com)

### Contributing

- [Contributing Guide](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Security Policy](../SECURITY.md)

---

**Last Updated**: 2025-01-06
**Version**: 1.0.0
**Maintained by**: JasaWeb Team
