# 🔌 API Endpoints Reference

Complete API reference for the JasaWeb Enterprise Client Management System.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Organizations](#organizations)
- [Users & Memberships](#users--memberships)
- [Projects](#projects)
- [Milestones](#milestones)
- [Files](#files)
- [Approvals](#approvals)
- [Tasks](#tasks)
- [Tickets](#tickets)
- [Invoices](#invoices)
- [Audit Logs](#audit-logs)
- [Health Check](#health-check)

---

## Base URL

```
Development: http://localhost:3000/api
Staging: https://staging-api.jasaweb.com/api
Production: https://api.jasaweb.com/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer {accessToken}
```

### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**

```json
{
  "id": "clx1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

### POST /auth/login

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

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout

Invalidate current session.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## Organizations

### GET /organizations

List all organizations for the current user.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
[
  {
    "id": "org-123",
    "name": "Acme Corporation",
    "billingEmail": "billing@acme.com",
    "plan": "enterprise",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-06T10:00:00Z"
  }
]
```

### POST /organizations

Create a new organization.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "name": "New Company",
  "billingEmail": "billing@newcompany.com",
  "plan": "professional"
}
```

**Response (201):**

```json
{
  "id": "org-456",
  "name": "New Company",
  "billingEmail": "billing@newcompany.com",
  "plan": "professional",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

### GET /organizations/:id

Get organization details.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "id": "org-123",
  "name": "Acme Corporation",
  "billingEmail": "billing@acme.com",
  "plan": "enterprise",
  "settings": {
    "timezone": "Asia/Jakarta",
    "language": "id"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-06T10:00:00Z"
}
```

### PATCH /organizations/:id

Update organization details.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "name": "Acme Corp Updated",
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

**Response (200):**

```json
{
  "id": "org-123",
  "name": "Acme Corp Updated",
  "billingEmail": "billing@acme.com",
  "plan": "enterprise",
  "settings": {
    "timezone": "Asia/Jakarta",
    "language": "id",
    "notifications": {
      "email": true,
      "inApp": true
    }
  },
  "updatedAt": "2025-01-06T11:00:00Z"
}
```

### DELETE /organizations/:id

Delete an organization (owner only).

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (204):**
No content

---

## Users & Memberships

### GET /organizations/:orgId/members

List organization members.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `role` (optional): Filter by role (owner, admin, finance, reviewer, member, guest)

**Response (200):**

```json
[
  {
    "id": "membership-123",
    "role": "admin",
    "user": {
      "id": "user-123",
      "email": "admin@acme.com",
      "name": "Jane Admin",
      "profilePicture": "https://..."
    },
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### POST /organizations/:orgId/invitations

Invite a user to the organization.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "role": "reviewer",
  "message": "Welcome to our project!"
}
```

**Response (201):**

```json
{
  "id": "invitation-789",
  "email": "newuser@example.com",
  "role": "reviewer",
  "status": "pending",
  "expiresAt": "2025-01-13T10:00:00Z",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

### PATCH /memberships/:id

Update member role.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "role": "admin"
}
```

**Response (200):**

```json
{
  "id": "membership-123",
  "role": "admin",
  "updatedAt": "2025-01-06T11:00:00Z"
}
```

### DELETE /memberships/:id

Remove a member from organization.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (204):**
No content

---

## Projects

### GET /projects

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

### POST /projects

Create a new project.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "name": "News Portal Redesign",
  "status": "draft",
  "startAt": "2025-02-01T00:00:00Z",
  "dueAt": "2025-04-01T00:00:00Z"
}
```

**Response (201):**

```json
{
  "id": "project-789",
  "name": "News Portal Redesign",
  "status": "draft",
  "startAt": "2025-02-01T00:00:00Z",
  "dueAt": "2025-04-01T00:00:00Z",
  "organizationId": "org-123",
  "createdAt": "2025-01-06T10:00:00Z",
  "updatedAt": "2025-01-06T10:00:00Z"
}
```

### GET /projects/:id

Get project details.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "id": "project-123",
  "name": "School Website Redesign",
  "status": "progress",
  "startAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-03-01T00:00:00Z",
  "organizationId": "org-123",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-06T10:00:00Z",
  "milestones": [...],
  "files": [...],
  "approvals": [...],
  "tasks": [...],
  "tickets": [...],
  "invoices": [...]
}
```

### GET /projects/:id/stats

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

### PATCH /projects/:id

Update project details.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "name": "School Website Redesign v2",
  "status": "review",
  "dueAt": "2025-03-15T00:00:00Z"
}
```

**Response (200):**

```json
{
  "id": "project-123",
  "name": "School Website Redesign v2",
  "status": "review",
  "startAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-03-15T00:00:00Z",
  "updatedAt": "2025-01-06T11:00:00Z"
}
```

### DELETE /projects/:id

Delete a project.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (204):**
No content

---

## Milestones

### GET /projects/:projectId/milestones

List project milestones.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `status` (optional): Filter by status (todo, in-progress, completed, overdue)

**Response (200):**

```json
[
  {
    "id": "milestone-123",
    "projectId": "project-123",
    "title": "Design Phase Complete",
    "dueAt": "2025-01-15T00:00:00Z",
    "status": "completed",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
```

### POST /projects/:projectId/milestones

Create a milestone.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "title": "Development Phase Complete",
  "dueAt": "2025-02-15T00:00:00Z",
  "status": "todo"
}
```

**Response (201):**

```json
{
  "id": "milestone-456",
  "projectId": "project-123",
  "title": "Development Phase Complete",
  "dueAt": "2025-02-15T00:00:00Z",
  "status": "todo",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

### PATCH /milestones/:id

Update milestone.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "status": "completed"
}
```

**Response (200):**

```json
{
  "id": "milestone-456",
  "status": "completed",
  "updatedAt": "2025-02-15T10:00:00Z"
}
```

### DELETE /milestones/:id

Delete a milestone.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (204):**
No content

---

## Files

### GET /projects/:projectId/files

List project files.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `folder` (optional): Filter by folder path
- `version` (optional): Filter by version

**Response (200):**

```json
[
  {
    "id": "file-123",
    "projectId": "project-123",
    "filename": "homepage-design.png",
    "folder": "designs/homepage",
    "version": "2.0",
    "size": 2048576,
    "checksum": "sha256:abc123...",
    "uploadedBy": {
      "id": "user-123",
      "name": "John Doe"
    },
    "createdAt": "2025-01-06T10:00:00Z"
  }
]
```

### POST /projects/:projectId/files

Upload a file.

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: File binary
- `folder` (optional): Folder path
- `version` (optional): Version string

**Response (201):**

```json
{
  "id": "file-456",
  "projectId": "project-123",
  "filename": "logo.svg",
  "folder": "assets/branding",
  "version": "1.0",
  "size": 15360,
  "checksum": "sha256:def456...",
  "uploadedById": "user-123",
  "createdAt": "2025-01-06T11:00:00Z"
}
```

### GET /files/:id/download

Download a file.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**
Binary file content with appropriate Content-Type header

### DELETE /files/:id

Delete a file.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (204):**
No content

---

## Approvals

### GET /projects/:projectId/approvals

List project approvals.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `status` (optional): Filter by status (pending, approved, rejected)
- `itemType` (optional): Filter by type (design, content, feature, page, deployment)

**Response (200):**

```json
[
  {
    "id": "approval-123",
    "projectId": "project-123",
    "itemType": "design",
    "itemId": "homepage-mockup-v2",
    "status": "pending",
    "note": "Please review the updated homepage design",
    "decidedBy": null,
    "decidedAt": null,
    "createdAt": "2025-01-06T10:00:00Z"
  }
]
```

### POST /projects/:projectId/approvals

Request approval.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "itemType": "design",
  "itemId": "homepage-mockup-v2",
  "note": "Please review the updated homepage design"
}
```

**Response (201):**

```json
{
  "id": "approval-456",
  "projectId": "project-123",
  "itemType": "design",
  "itemId": "homepage-mockup-v2",
  "status": "pending",
  "note": "Please review the updated homepage design",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

### PATCH /approvals/:id

Approve or reject.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "status": "approved",
  "note": "Looks great! Approved for implementation."
}
```

**Response (200):**

```json
{
  "id": "approval-456",
  "status": "approved",
  "decidedById": "user-789",
  "decidedAt": "2025-01-06T14:00:00Z",
  "note": "Looks great! Approved for implementation.",
  "updatedAt": "2025-01-06T14:00:00Z"
}
```

### GET /approvals/:id/history

Get approval history.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
[
  {
    "action": "created",
    "actor": "John Doe",
    "timestamp": "2025-01-06T10:00:00Z",
    "note": "Please review the updated homepage design"
  },
  {
    "action": "approved",
    "actor": "Jane Admin",
    "timestamp": "2025-01-06T14:00:00Z",
    "note": "Looks great! Approved for implementation."
  }
]
```

---

## Tasks

### GET /projects/:projectId/tasks

List project tasks.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `status` (optional): Filter by status (todo, in-progress, review, completed)
- `assigneeId` (optional): Filter by assignee

**Response (200):**

```json
[
  {
    "id": "task-123",
    "projectId": "project-123",
    "title": "Implement contact form",
    "assignee": {
      "id": "user-123",
      "name": "John Doe"
    },
    "status": "in-progress",
    "dueAt": "2025-01-20T00:00:00Z",
    "labels": ["frontend", "high-priority"],
    "createdAt": "2025-01-06T10:00:00Z"
  }
]
```

### POST /projects/:projectId/tasks

Create a task.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "title": "Implement contact form",
  "assigneeId": "user-123",
  "status": "todo",
  "dueAt": "2025-01-20T00:00:00Z",
  "labels": ["frontend", "high-priority"]
}
```

**Response (201):**

```json
{
  "id": "task-456",
  "projectId": "project-123",
  "title": "Implement contact form",
  "assigneeId": "user-123",
  "status": "todo",
  "dueAt": "2025-01-20T00:00:00Z",
  "labels": ["frontend", "high-priority"],
  "createdAt": "2025-01-06T10:00:00Z"
}
```

### PATCH /tasks/:id

Update task.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "status": "completed"
}
```

**Response (200):**

```json
{
  "id": "task-456",
  "status": "completed",
  "updatedAt": "2025-01-20T15:00:00Z"
}
```

### DELETE /tasks/:id

Delete a task.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (204):**
No content

---

## Tickets

### GET /tickets

List tickets for the current organization.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `status` (optional): Filter by status (open, in-progress, in-review, resolved, closed)
- `priority` (optional): Filter by priority (low, medium, high, critical)
- `type` (optional): Filter by type (bug, feature, improvement, question, task)
- `projectId` (optional): Filter by project

**Response (200):**

```json
[
  {
    "id": "ticket-123",
    "organizationId": "org-123",
    "projectId": "project-123",
    "type": "bug",
    "priority": "high",
    "status": "open",
    "title": "Login page not loading",
    "assignee": null,
    "slaDueAt": "2025-01-06T18:00:00Z",
    "createdAt": "2025-01-06T14:00:00Z"
  }
]
```

### POST /tickets

Create a ticket.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "type": "bug",
  "priority": "high",
  "title": "Login page not loading",
  "description": "Users cannot access the login page. Error 500 displayed.",
  "projectId": "project-123"
}
```

**Response (201):**

```json
{
  "id": "ticket-456",
  "organizationId": "org-123",
  "projectId": "project-123",
  "type": "bug",
  "priority": "high",
  "status": "open",
  "title": "Login page not loading",
  "slaDueAt": "2025-01-06T18:00:00Z",
  "createdAt": "2025-01-06T14:00:00Z"
}
```

### GET /tickets/:id

Get ticket details.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "id": "ticket-456",
  "organizationId": "org-123",
  "projectId": "project-123",
  "type": "bug",
  "priority": "high",
  "status": "in-progress",
  "title": "Login page not loading",
  "description": "Users cannot access the login page. Error 500 displayed.",
  "assignee": {
    "id": "user-789",
    "name": "Support Agent"
  },
  "slaDueAt": "2025-01-06T18:00:00Z",
  "createdAt": "2025-01-06T14:00:00Z",
  "updatedAt": "2025-01-06T15:00:00Z"
}
```

### PATCH /tickets/:id

Update ticket.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "status": "in-progress",
  "assigneeId": "user-789"
}
```

**Response (200):**

```json
{
  "id": "ticket-456",
  "status": "in-progress",
  "assigneeId": "user-789",
  "updatedAt": "2025-01-06T15:00:00Z"
}
```

### PATCH /tickets/:id/resolve

Resolve a ticket.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "resolution": "Fixed authentication service configuration. Issue resolved.",
  "status": "resolved"
}
```

**Response (200):**

```json
{
  "id": "ticket-456",
  "status": "resolved",
  "resolution": "Fixed authentication service configuration. Issue resolved.",
  "updatedAt": "2025-01-06T16:00:00Z"
}
```

---

## Invoices

### GET /invoices

List invoices for the current organization.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `status` (optional): Filter by status (draft, issued, paid, overdue, cancelled)
- `projectId` (optional): Filter by project

**Response (200):**

```json
[
  {
    "id": "invoice-123",
    "organizationId": "org-123",
    "projectId": "project-123",
    "amount": 5000000,
    "currency": "IDR",
    "issuedAt": "2025-01-01T00:00:00Z",
    "dueAt": "2025-01-15T00:00:00Z",
    "status": "paid",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### POST /invoices

Create an invoice.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "projectId": "project-123",
  "amount": 5000000,
  "currency": "IDR",
  "issuedAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-01-15T00:00:00Z",
  "status": "issued"
}
```

**Response (201):**

```json
{
  "id": "invoice-456",
  "organizationId": "org-123",
  "projectId": "project-123",
  "amount": 5000000,
  "currency": "IDR",
  "issuedAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-01-15T00:00:00Z",
  "status": "issued",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

### GET /invoices/:id

Get invoice details.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "id": "invoice-456",
  "organizationId": "org-123",
  "projectId": "project-123",
  "amount": 5000000,
  "currency": "IDR",
  "issuedAt": "2025-01-01T00:00:00Z",
  "dueAt": "2025-01-15T00:00:00Z",
  "status": "issued",
  "createdAt": "2025-01-06T10:00:00Z",
  "updatedAt": "2025-01-06T10:00:00Z"
}
```

### POST /invoices/:id/payments

Record a payment.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "amount": 5000000,
  "gateway": "bank_transfer",
  "reference": "TRX-20250105-001",
  "paidAt": "2025-01-05T10:30:00Z"
}
```

**Response (201):**

```json
{
  "id": "payment-789",
  "invoiceId": "invoice-456",
  "amount": 5000000,
  "gateway": "bank_transfer",
  "reference": "TRX-20250105-001",
  "paidAt": "2025-01-05T10:30:00Z",
  "createdAt": "2025-01-05T10:30:00Z"
}
```

### GET /invoices/:id/download

Download invoice PDF.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**
PDF file with Content-Type: application/pdf

---

## Audit Logs

### GET /audit-logs

Query audit logs.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Query Parameters:**

- `action` (optional): Filter by action type
- `actorId` (optional): Filter by actor
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**

```json
{
  "items": [
    {
      "id": "log-123",
      "organizationId": "org-123",
      "actorId": "user-123",
      "actor": {
        "id": "user-123",
        "name": "John Doe"
      },
      "action": "file_upload",
      "target": "File",
      "meta": {
        "fileId": "file-456",
        "filename": "logo.svg",
        "projectId": "project-123"
      },
      "createdAt": "2025-01-06T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5
  }
}
```

### GET /audit-logs/user/:userId

Get user activity logs.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
[
  {
    "id": "log-123",
    "action": "user_login",
    "target": "User",
    "meta": {
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    },
    "createdAt": "2025-01-06T09:00:00Z"
  }
]
```

### GET /audit-logs/organization/:orgId

Get organization activity logs.

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
[
  {
    "id": "log-456",
    "actorId": "user-123",
    "actor": {
      "name": "John Doe"
    },
    "action": "project_created",
    "target": "Project",
    "meta": {
      "projectId": "project-789",
      "projectName": "News Portal Redesign"
    },
    "createdAt": "2025-01-06T10:00:00Z"
  }
]
```

---

## Health Check

### GET /health

Check API health status.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2025-01-06T12:00:00Z",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "responseTime": 5
  },
  "redis": {
    "status": "connected",
    "responseTime": 2
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

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

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later."
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **File Upload**: 10 requests per minute per user

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704542400
```

---

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `desc`)

Paginated responses include:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Filtering

Many list endpoints support filtering via query parameters. Common filters include:

- `status`: Filter by status
- `type`: Filter by type
- `priority`: Filter by priority
- `startDate`: Filter by start date
- `endDate`: Filter by end date

Example:

```http
GET /api/tickets?status=open&priority=high&type=bug
```

---

## Swagger Documentation

Interactive API documentation is available at:

- Development: http://localhost:3000/api/docs
- Staging: https://staging-api.jasaweb.com/api/docs
- Production: https://api.jasaweb.com/api/docs

---

**Last Updated**: 2025-01-06
**Version**: 1.0.0
**Maintained by**: JasaWeb Team
