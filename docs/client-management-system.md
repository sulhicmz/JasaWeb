# 🏢 Enterprise Client Management System Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Core Features](#core-features)
- [User Roles & Permissions](#user-roles--permissions)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Client Portal Features](#client-portal-features)
- [Multi-Tenancy](#multi-tenancy)
- [Security & Compliance](#security--compliance)
- [Integration Guide](#integration-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### Purpose

The JasaWeb Enterprise Client Management System is a comprehensive platform designed to streamline web development service delivery through an integrated client portal. It serves as a single source of truth for project collaboration, file management, approvals, support tickets, and billing.

### Key Objectives

- **Lead Generation**: Generate qualified leads for School Websites, News Portals, and Company Profiles
- **Client Collaboration**: Accelerate project delivery through transparent communication
- **Process Standardization**: Reduce project cycle time to 8-10 weeks
- **Client Satisfaction**: Achieve NPS ≥ 8/10 with SLA response ≤ 4 hours

### Target Audience

- **External Clients**: Organizations purchasing web development services
- **Internal Teams**: Project managers, designers, developers, and support staff
- **Stakeholders**: Finance teams, reviewers, and decision-makers

---

## 🏗️ System Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Marketing    │  │ Client       │  │ Admin        │  │
│  │ Website      │  │ Portal       │  │ Dashboard    │  │
│  │ (Astro)      │  │ (Astro)      │  │ (Astro)      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │           NestJS REST API                         │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │  │
│  │  │ Auth   │ │Projects│ │ Files  │ │Tickets │   │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │ Redis Cache  │  │ S3 Storage   │  │
│  │ (Prisma ORM) │  │ (Optional)   │  │ (Files)      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Astro 4.0 + TypeScript | Server-side rendering, static generation |
| **Backend API** | NestJS 10.0 | RESTful API, business logic |
| **Database** | PostgreSQL 15+ | Primary data storage |
| **ORM** | Prisma 6.16.3 | Type-safe database access |
| **Authentication** | JWT + Session | Secure user authentication |
| **File Storage** | S3-compatible | Document and asset storage |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Testing** | Vitest + Jest | Unit and integration testing |

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ CDN          │  │ Load         │  │ Application  │  │
│  │ (Static)     │→ │ Balancer     │→ │ Servers      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                            ↓             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Database     │  │ Cache        │  │ Object       │  │
│  │ (Primary)    │  │ (Redis)      │  │ Storage      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Core Features

### 1. Organization Management

#### Overview
Organizations represent client companies or entities using the platform. Each organization has its own isolated data space (multi-tenancy).

#### Key Features
- **Organization Profile**: Name, billing email, plan, custom settings
- **Member Management**: Add/remove users, assign roles
- **Billing Configuration**: Payment methods, invoicing preferences
- **Custom Settings**: Organization-specific configurations (JSON)

#### Data Model
```typescript
interface Organization {
  id: string;
  name: string;
  billingEmail: string;
  plan?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Project Management

#### Overview
Projects are the core entity representing client engagements. Each project tracks deliverables, milestones, files, and approvals.

#### Key Features
- **Project Lifecycle**: Draft → In Progress → Review → Completed
- **Timeline Management**: Start date, due date, milestone tracking
- **Status Tracking**: Real-time project status updates
- **Resource Allocation**: Team assignments, task distribution

#### Project States
```typescript
enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}
```

#### Data Model
```typescript
interface Project {
  id: string;
  organizationId: string;
  name: string;
  status: ProjectStatus;
  startAt?: Date;
  dueAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  milestones: Milestone[];
  files: File[];
  approvals: Approval[];
  tasks: Task[];
  tickets: Ticket[];
  invoices: Invoice[];
}
```

### 3. Milestone Tracking

#### Overview
Milestones represent key deliverables or phases within a project. They help track progress and ensure timely delivery.

#### Key Features
- **Milestone Planning**: Define key project phases
- **Due Date Management**: Track deadlines and overdue items
- **Status Updates**: Todo → In Progress → Completed
- **Progress Calculation**: Automatic progress percentage

#### Milestone States
```typescript
enum MilestoneStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}
```

### 4. File Management

#### Overview
Centralized file storage for project assets, documents, and deliverables with version control and access management.

#### Key Features
- **File Upload/Download**: Secure file transfer
- **Version Control**: Track file versions and changes
- **Folder Organization**: Hierarchical folder structure
- **File Preview**: Preview images, PDFs, and documents
- **Access Control**: Role-based file access
- **Metadata Tracking**: File size, checksum, upload timestamp

#### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, PNG, GIF, SVG, WEBP
- **Design Files**: PSD, AI, SKETCH, FIGMA
- **Archives**: ZIP, RAR, TAR
- **Videos**: MP4, MOV, AVI (limited)

#### Data Model
```typescript
interface File {
  id: string;
  projectId: string;
  folder?: string;
  filename: string;
  version?: string;
  size?: number;
  checksum?: string;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. Approval Workflow

#### Overview
Structured approval process for designs, content, and deliverables with audit trail and notification system.

#### Key Features
- **Approval Requests**: Submit items for client approval
- **Review Process**: Comment, approve, or reject
- **Audit Trail**: Track all approval decisions
- **Notifications**: Email alerts for pending approvals
- **Timestamping**: Record decision timestamps

#### Approval Types
- **Design Approval**: UI/UX designs, mockups
- **Content Approval**: Copy, images, videos
- **Page Approval**: Complete page layouts
- **Feature Approval**: New functionality
- **Final Approval**: Project completion sign-off

#### Approval States
```typescript
enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}
```

#### Data Model
```typescript
interface Approval {
  id: string;
  projectId: string;
  itemType: string;
  itemId: string;
  status: ApprovalStatus;
  decidedById?: string;
  decidedAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Task Management

#### Overview
Task tracking system for project work items with assignment, status tracking, and deadline management.

#### Key Features
- **Task Creation**: Define work items and requirements
- **Assignment**: Assign tasks to team members
- **Status Tracking**: Monitor task progress
- **Labels**: Categorize tasks with custom labels
- **Due Dates**: Set and track task deadlines

#### Task States
```typescript
enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  COMPLETED = 'completed'
}
```

### 7. Support Ticket System

#### Overview
Integrated support system for client inquiries, bug reports, and feature requests with SLA tracking.

#### Key Features
- **Ticket Creation**: Submit support requests
- **Priority Management**: Low, Medium, High, Critical
- **SLA Tracking**: Monitor response times
- **Assignment**: Route tickets to appropriate team members
- **Status Updates**: Track ticket lifecycle
- **Resolution Tracking**: Record solutions and outcomes

#### Ticket Types
```typescript
enum TicketType {
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  QUESTION = 'question',
  TASK = 'task'
}
```

#### Priority Levels
```typescript
enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

#### Ticket States
```typescript
enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  IN_REVIEW = 'in-review',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}
```

### 8. Invoice & Billing

#### Overview
Comprehensive billing system for project invoicing, payment tracking, and financial reporting.

#### Key Features
- **Invoice Generation**: Create and send invoices
- **Payment Tracking**: Monitor payment status
- **Milestone Billing**: Invoice based on project milestones
- **Payment Methods**: Multiple payment gateway support
- **Receipt Generation**: Automatic receipt creation
- **Currency Support**: Multi-currency invoicing

#### Invoice States
```typescript
enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}
```

#### Data Model
```typescript
interface Invoice {
  id: string;
  organizationId: string;
  projectId?: string;
  amount: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

### 9. Audit Logging

#### Overview
Comprehensive audit trail for all critical system actions ensuring accountability and compliance.

#### Key Features
- **Action Logging**: Record all important actions
- **User Tracking**: Track who performed each action
- **Timestamp Recording**: Precise action timestamps
- **Metadata Storage**: Additional context for each action
- **Compliance Support**: Meet regulatory requirements

#### Logged Actions
- User authentication (login, logout)
- File operations (upload, download, delete)
- Approval decisions (approve, reject)
- Project changes (create, update, delete)
- Invoice operations (create, pay, cancel)
- User management (add, remove, role change)

---

## 👥 User Roles & Permissions

### Role-Based Access Control (RBAC)

The system implements a comprehensive RBAC system with organization-level and project-level permissions.

### External/Client Roles

#### 1. Organization Owner
**Permissions:**
- Full access to organization settings
- Manage all organization members
- View and manage all projects
- Access all financial information
- Configure billing and payment methods
- Delete organization (with confirmation)

**Use Cases:**
- Company CEO or business owner
- Primary decision-maker
- Contract signatory

#### 2. Organization Admin
**Permissions:**
- Manage organization members (except owner)
- Create and manage projects
- View financial information
- Manage files and approvals
- Create and manage tickets

**Use Cases:**
- Project manager on client side
- IT administrator
- Operations manager

#### 3. Finance Role
**Permissions:**
- View all invoices and payments
- Download receipts and financial reports
- Update payment information
- View project budgets
- Limited project access (read-only)

**Use Cases:**
- Accounting department
- Finance manager
- Bookkeeper

#### 4. Reviewer/Stakeholder
**Permissions:**
- View assigned projects
- Approve or reject submissions
- Comment on deliverables
- View project files
- Limited edit capabilities

**Use Cases:**
- Content reviewer
- Design approver
- Department head

#### 5. Guest (Read-Only)
**Permissions:**
- View assigned projects (read-only)
- View project files
- View project status and milestones
- No edit or approval capabilities

**Use Cases:**
- External stakeholders
- Temporary consultants
- Observers

### Internal/Staff Roles

#### 1. Super Admin
**Permissions:**
- Full system access
- Manage all organizations
- System configuration
- User management across organizations
- Access audit logs

#### 2. Project Manager
**Permissions:**
- Manage assigned projects
- Create and assign tasks
- Upload and organize files
- Request approvals
- Create invoices
- Manage project timeline

#### 3. Designer
**Permissions:**
- Upload design files
- Request design approvals
- View project requirements
- Comment on feedback

#### 4. Developer
**Permissions:**
- Access project files
- Update task status
- Upload deliverables
- View project specifications

#### 5. Support Agent
**Permissions:**
- View and manage tickets
- Access project information
- Communicate with clients
- Update ticket status

### Permission Matrix

| Action | Owner | Admin | Finance | Reviewer | Guest | PM | Support |
|--------|-------|-------|---------|----------|-------|----|---------|
| View Projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Projects | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Edit Projects | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Delete Projects | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Upload Files | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Download Files | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete Files | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Request Approval | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve/Reject | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create Tickets | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Manage Tickets | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Invoices | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Create Invoices | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage Members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 🗄️ Data Models

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │───────│ Membership  │───────│Organization │
└─────────────┘       └─────────────┘       └─────────────┘
       │                                            │
       │                                            │
       │              ┌─────────────┐              │
       └──────────────│   Project   │──────────────┘
                      └─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌─────────┐         ┌─────────┐        ┌─────────┐
   │Milestone│         │  File   │        │Approval │
   └─────────┘         └─────────┘        └─────────┘
        │                   │                   │
   ┌─────────┐         ┌─────────┐        ┌─────────┐
   │  Task   │         │ Ticket  │        │ Invoice │
   └─────────┘         └─────────┘        └─────────┘
```

### Core Entities

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

#### Membership
```prisma
model Membership {
  id             String       @id @default(cuid())
  role           String       // owner, admin, reviewer, finance, member
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  userId         String
  user           User         @relation(fields: [userId], references: [id])
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([userId, organizationId])
}
```

#### Project
```prisma
model Project {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  name           String
  status         String
  startAt        DateTime?
  dueAt          DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  milestones     Milestone[]
  files          File[]
  approvals      Approval[]
  tasks          Task[]
  tickets        Ticket[]
  invoices       Invoice[]
}
```

### Database Indexes

For optimal performance, the following indexes are recommended:

```sql
-- User indexes
CREATE INDEX idx_user_email ON "User"(email);

-- Organization indexes
CREATE INDEX idx_org_billing_email ON "Organization"(billingEmail);

-- Membership indexes
CREATE INDEX idx_membership_user ON "Membership"(userId);
CREATE INDEX idx_membership_org ON "Membership"(organizationId);

-- Project indexes
CREATE INDEX idx_project_org ON "Project"(organizationId);
CREATE INDEX idx_project_status ON "Project"(status);
CREATE INDEX idx_project_dates ON "Project"(startAt, dueAt);

-- File indexes
CREATE INDEX idx_file_project ON "File"(projectId);
CREATE INDEX idx_file_uploader ON "File"(uploadedById);

-- Ticket indexes
CREATE INDEX idx_ticket_org ON "Ticket"(organizationId);
CREATE INDEX idx_ticket_project ON "Ticket"(projectId);
CREATE INDEX idx_ticket_status ON "Ticket"(status);
CREATE INDEX idx_ticket_priority ON "Ticket"(priority);

-- Invoice indexes
CREATE INDEX idx_invoice_org ON "Invoice"(organizationId);
CREATE INDEX idx_invoice_project ON "Invoice"(projectId);
CREATE INDEX idx_invoice_status ON "Invoice"(status);
```

---

## 🔌 API Reference

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.jasaweb.com/api
```

### Authentication

All API requests require authentication using JWT tokens.

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Projects API

#### List Projects
```http
GET /projects?view=summary
Authorization: Bearer {accessToken}

Query Parameters:
- view: 'summary' | 'detail' (default: 'summary')
- status: Filter by status
- organizationId: Filter by organization

Response:
{
  "data": [
    {
      "id": "project-id",
      "name": "Website Redesign",
      "status": "in-progress",
      "startAt": "2025-01-01T00:00:00Z",
      "dueAt": "2025-03-01T00:00:00Z",
      "_count": {
        "milestones": 5,
        "files": 23,
        "tasks": 15
      }
    }
  ],
  "total": 1
}
```

#### Get Project Details
```http
GET /projects/{id}
Authorization: Bearer {accessToken}

Response:
{
  "id": "project-id",
  "name": "Website Redesign",
  "status": "in-progress",
  "startAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-03-01T00:00:00Z",
  "milestones": [...],
  "files": [...],
  "approvals": [...],
  "tasks": [...]
}
```

#### Create Project
```http
POST /projects
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "New Website Project",
  "status": "draft",
  "startAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-03-01T00:00:00Z"
}

Response:
{
  "id": "new-project-id",
  "name": "New Website Project",
  "status": "draft",
  "organizationId": "org-id",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Update Project
```http
PUT /projects/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated Project Name",
  "status": "in-progress"
}

Response:
{
  "id": "project-id",
  "name": "Updated Project Name",
  "status": "in-progress",
  "updatedAt": "2025-01-02T00:00:00Z"
}
```

#### Delete Project
```http
DELETE /projects/{id}
Authorization: Bearer {accessToken}

Response:
{
  "message": "Project deleted successfully",
  "id": "project-id"
}
```

#### Get Project Statistics
```http
GET /projects/{id}/stats
Authorization: Bearer {accessToken}

Response:
{
  "milestoneCount": 5,
  "completedMilestones": 3,
  "fileCount": 23,
  "pendingApprovals": 2,
  "taskCount": 15,
  "completedTasks": 10,
  "progress": 60
}
```

### Files API

#### Upload File
```http
POST /files
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Form Data:
- file: [binary file data]
- projectId: "project-id"
- folder: "designs" (optional)

Response:
{
  "id": "file-id",
  "filename": "design-mockup.png",
  "size": 1024000,
  "projectId": "project-id",
  "uploadedById": "user-id",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Download File
```http
GET /files/{id}/download
Authorization: Bearer {accessToken}

Response: Binary file data
```

### Approvals API

#### Request Approval
```http
POST /approvals
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "projectId": "project-id",
  "itemType": "design",
  "itemId": "design-id",
  "note": "Please review the homepage design"
}

Response:
{
  "id": "approval-id",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Approve/Reject
```http
PUT /approvals/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "approved",
  "note": "Looks great! Approved."
}

Response:
{
  "id": "approval-id",
  "status": "approved",
  "decidedById": "user-id",
  "decidedAt": "2025-01-01T12:00:00Z",
  "note": "Looks great! Approved."
}
```

### Tickets API

#### Create Ticket
```http
POST /tickets
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "projectId": "project-id",
  "type": "bug",
  "priority": "high",
  "title": "Login button not working",
  "description": "Users cannot click the login button on mobile"
}

Response:
{
  "id": "ticket-id",
  "status": "open",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Update Ticket Status
```http
PUT /tickets/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "resolved",
  "resolution": "Fixed CSS issue causing button to be unclickable"
}
```

### Invoices API

#### Create Invoice
```http
POST /invoices
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "projectId": "project-id",
  "amount": 5000.00,
  "currency": "USD",
  "issuedAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-01-15T00:00:00Z"
}
```

#### List Invoices
```http
GET /invoices?status=issued
Authorization: Bearer {accessToken}

Query Parameters:
- status: Filter by status
- projectId: Filter by project
- organizationId: Filter by organization
```

### Error Responses

All API errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

Common HTTP Status Codes:
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `500 Internal Server Error`: Server error

---

## 🎨 Client Portal Features

### Dashboard

The client dashboard provides an at-a-glance view of all active projects and important metrics.

#### Key Widgets

1. **Project Overview**
   - Active projects count
   - Project progress indicators
   - Upcoming milestones
   - Overdue items alert

2. **Recent Activity**
   - Latest file uploads
   - Recent approvals
   - New tickets
   - Status updates

3. **Pending Actions**
   - Approvals awaiting decision
   - Overdue invoices
   - Unanswered tickets
   - Required content submissions

4. **Quick Links**
   - Staging environment
   - Production site
   - Project documentation
   - Support contact

5. **Financial Summary**
   - Outstanding invoices
   - Payment history
   - Budget utilization
   - Next payment due

### Project View

Detailed project interface with multiple tabs:

#### Overview Tab
- Project status and timeline
- Milestone progress
- Team members
- Quick stats

#### Files Tab
- Folder structure
- File upload/download
- Version history
- File preview

#### Approvals Tab
- Pending approvals
- Approval history
- Submit new items
- Review and comment

#### Tasks Tab
- Task list
- Status tracking
- Assignment view
- Due dates

#### Tickets Tab
- Open tickets
- Ticket history
- Create new ticket
- SLA status

#### Invoices Tab
- Invoice list
- Payment status
- Download receipts
- Payment history

### Notification System

#### Notification Types

1. **Email Notifications**
   - Approval requests
   - Ticket updates
   - Invoice reminders
   - Milestone completions
   - File uploads

2. **In-App Notifications**
   - Real-time updates
   - Action required alerts
   - Status changes
   - Comments and mentions

3. **Notification Preferences**
   - Email frequency (immediate, daily digest, weekly)
   - Notification categories
   - Quiet hours
   - Channel preferences

### User Settings

#### Profile Management
- Update personal information
- Change password
- Upload profile picture
- Set timezone and language

#### Organization Settings
- Update organization details
- Manage billing information
- Configure notification preferences
- Customize portal appearance

#### Security Settings
- Two-factor authentication
- Active sessions
- Login history
- API keys (for integrations)

---

## 🏢 Multi-Tenancy

### Overview

JasaWeb implements organization-based multi-tenancy, ensuring complete data isolation between different client organizations.

### Implementation

#### Data Isolation

Every data model includes an `organizationId` field that automatically filters queries:

```typescript
// Multi-tenant Prisma service
@Injectable()
export class MultiTenantPrismaService extends PrismaClient {
  constructor() {
    super();

    // Automatically add organizationId filter
    this.$use(async (params, next) => {
      const organizationId = getCurrentOrganizationId();

      if (params.model && organizationId) {
        if (params.action === 'findMany' || params.action === 'findFirst') {
          params.args.where = {
            ...params.args.where,
            organizationId
          };
        }
      }

      return next(params);
    });
  }
}
```

#### Organization Context

The current organization is determined from:
1. JWT token claims
2. User's active membership
3. Request headers (for API calls)

```typescript
// Extract organization from JWT
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get organization from user's membership
    const organizationId = user.activeOrganizationId;

    // Attach to request
    request.organizationId = organizationId;

    return true;
  }
}
```

### Benefits

1. **Data Security**: Complete isolation between organizations
2. **Performance**: Efficient queries with automatic filtering
3. **Scalability**: Easy to add new organizations
4. **Compliance**: Meet data residency requirements

### Best Practices

1. **Always Include Organization ID**: Never query without organization context
2. **Validate Access**: Check user membership before operations
3. **Audit Trail**: Log all cross-organization access attempts
4. **Test Isolation**: Verify data cannot leak between organizations

---

## 🔒 Security & Compliance

### Authentication

#### JWT-Based Authentication

```typescript
// Token structure
{
  "sub": "user-id",
  "email": "user@example.com",
  "organizationId": "org-id",
  "role": "admin",
  "iat": 1640000000,
  "exp": 1640003600
}
```

#### Session Management

- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry
- Session tracking in database
- Automatic token rotation

#### Password Security

- Bcrypt hashing (12 rounds)
- Password strength requirements
- Password history (prevent reuse)
- Account lockout after failed attempts

### Authorization

#### Role-Based Access Control

```typescript
// Guard implementation
@UseGuards(RolesGuard)
@Roles('admin', 'owner')
async deleteProject(@Param('id') id: string) {
  return this.projectService.remove(id);
}
```

#### Resource-Level Permissions

```typescript
// Check project ownership
async canAccessProject(userId: string, projectId: string): Promise<boolean> {
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: {
        include: {
          memberships: {
            where: { userId }
          }
        }
      }
    }
  });

  return project?.organization.memberships.length > 0;
}
```

### Data Protection

#### Encryption

- **At Rest**: Database encryption, encrypted backups
- **In Transit**: TLS 1.3, HTTPS only
- **File Storage**: S3 server-side encryption

#### Data Privacy

- GDPR compliance
- Data minimization
- Right to erasure
- Data portability
- Privacy by design

### Security Best Practices

#### Input Validation

```typescript
// DTO validation with class-validator
export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsOptional()
  @IsDate()
  startAt?: Date;
}
```

#### SQL Injection Prevention

- Prisma ORM with parameterized queries
- No raw SQL queries without sanitization
- Input validation on all endpoints

#### XSS Prevention

- Content Security Policy headers
- Output encoding
- Sanitize user input
- Use framework protections

#### CSRF Protection

- CSRF tokens for state-changing operations
- SameSite cookie attribute
- Origin validation

### Audit & Compliance

#### Audit Logging

All critical actions are logged:

```typescript
await this.auditLog.create({
  organizationId,
  actorId: userId,
  action: 'project.delete',
  target: 'Project',
  meta: {
    projectId,
    projectName
  }
});
```

#### Compliance Features

- **GDPR**: Data export, deletion, consent management
- **SOC 2**: Access controls, audit trails, encryption
- **ISO 27001**: Security policies, risk management
- **PCI DSS**: Payment data handling (if applicable)

### Security Monitoring

#### Threat Detection

- Failed login attempts monitoring
- Unusual access patterns
- Rate limiting
- IP blocking

#### Incident Response

1. Detection and analysis
2. Containment
3. Eradication
4. Recovery
5. Post-incident review

---

## 🔗 Integration Guide

### Webhook Integration

#### Available Webhooks

```typescript
// Webhook events
enum WebhookEvent {
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  APPROVAL_REQUESTED = 'approval.requested',
  APPROVAL_DECIDED = 'approval.decided',
  TICKET_CREATED = 'ticket.created',
  TICKET_RESOLVED = 'ticket.resolved',
  INVOICE_ISSUED = 'invoice.issued',
  INVOICE_PAID = 'invoice.paid'
}
```

#### Webhook Payload

```json
{
  "event": "project.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "organizationId": "org-id",
  "data": {
    "id": "project-id",
    "name": "New Project",
    "status": "draft"
  }
}
```

### API Integration

#### Authentication

```typescript
// Generate API key
const apiKey = await generateApiKey(organizationId);

// Use in requests
fetch('https://api.jasaweb.com/api/projects', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

### Third-Party Integrations

#### Email Service

```typescript
// Email configuration
{
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}
```

#### Payment Gateway

```typescript
// Payment integration
interface PaymentGateway {
  createPayment(amount: number, currency: string): Promise<Payment>;
  verifyPayment(paymentId: string): Promise<boolean>;
  refundPayment(paymentId: string): Promise<Refund>;
}
```

#### Analytics

```typescript
// Google Analytics 4
gtag('event', 'project_created', {
  project_id: projectId,
  organization_id: organizationId
});
```

---

## 📚 Best Practices

### Development

1. **Follow TypeScript Best Practices**
   - Use strict mode
   - Define interfaces for all data structures
   - Avoid `any` type

2. **Code Organization**
   - One feature per module
   - Separate concerns (controller, service, repository)
   - Use dependency injection

3. **Error Handling**
   - Use custom exceptions
   - Provide meaningful error messages
   - Log errors appropriately

4. **Testing**
   - Write unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for critical workflows

### Performance

1. **Database Optimization**
   - Use appropriate indexes
   - Optimize queries (avoid N+1)
   - Use pagination for large datasets
   - Implement caching where appropriate

2. **API Performance**
   - Use summary views for list endpoints
   - Implement rate limiting
   - Enable compression
   - Use CDN for static assets

3. **Frontend Performance**
   - Lazy load components
   - Optimize images
   - Minimize bundle size
   - Use server-side rendering

### Security

1. **Authentication**
   - Use strong password policies
   - Implement 2FA
   - Rotate tokens regularly
   - Monitor suspicious activity

2. **Authorization**
   - Implement RBAC consistently
   - Validate permissions on every request
   - Use principle of least privilege

3. **Data Protection**
   - Encrypt sensitive data
   - Sanitize user input
   - Use HTTPS everywhere
   - Regular security audits

---

## 🔧 Troubleshooting

### Common Issues

#### Authentication Issues

**Problem**: Token expired error
```
Solution: Use refresh token to get new access token
POST /auth/refresh with refreshToken
```

**Problem**: Unauthorized access
```
Solution: Check user role and permissions
Verify JWT token is valid and not expired
```

#### Database Issues

**Problem**: Connection timeout
```
Solution: Check database connection string
Verify database is running
Check network connectivity
```

**Problem**: Slow queries
```
Solution: Add appropriate indexes
Optimize query structure
Use pagination for large datasets
```

#### File Upload Issues

**Problem**: File upload fails
```
Solution: Check file size limits
Verify S3 credentials
Check network connectivity
```

**Problem**: File not found
```
Solution: Verify file ID is correct
Check user has access to project
Verify file exists in storage
```

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
DEBUG=jasaweb:* pnpm dev

# Or in .env file
LOG_LEVEL=debug
```

### Support Resources

- **Documentation**: https://docs.jasaweb.com
- **API Reference**: https://api.jasaweb.com/docs
- **GitHub Issues**: https://github.com/jasaweb/jasaweb/issues
- **Email Support**: support@jasaweb.com
- **Community Forum**: https://community.jasaweb.com

---

## 📝 Changelog

### Version 1.0.0 (2025-01-01)

**Initial Release**
- Complete client management system
- Project management with milestones
- File management with version control
- Approval workflow system
- Support ticket system
- Invoice and billing management
- Multi-tenancy support
- Role-based access control
- Audit logging
- RESTful API

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Setup environment: `cp .env.example .env`
4. Start database: `docker-compose up -d`
5. Run migrations: `pnpm db:migrate`
6. Start development: `pnpm dev`

### Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by the JasaWeb Team**

[🌐 Website](https://jasaweb.com) • [📧 Email](mailto:hello@jasaweb.com) • [💬 Community](https://community.jasaweb.com)

</div>
