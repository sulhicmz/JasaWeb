# 🔌 API Endpoints Reference

Complete API reference for the JasaWeb Enterprise Client Management System.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Users](#users)
- [Projects](#projects)
- [Tasks](#tasks)
- [Milestones](#milestones)
- [Files](#files)
- [Approvals](#approvals)
- [Tickets](#tickets)
- [Invoices](#invoices)
- [Knowledge Base](#knowledge-base)
- [Analytics](#analytics)
- [Dashboard](#dashboard)
- [Health Check](#health-check)
- [Security](#security)

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

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### POST /auth/login

Authenticate user and return tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "refresh-token"
}
```

### POST /auth/logout

Logout user and invalidate tokens.

**Request Body:**

```json
{
  "refreshToken": "refresh-token"
}
```

### GET /auth/profile

Get current authenticated user profile.

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "organizationId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Users

### GET /users

List all users (requires admin role).

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or email
- `role`: Filter by role

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### POST /users

Create a new user (requires admin role).

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "name": "New User",
  "role": "user"
}
```

### GET /users/:id

Get user by ID.

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "organizationId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /users/:id

Update user information.

**Request Body:**

```json
{
  "name": "John Updated",
  "role": "admin"
}
```

### DELETE /users/:id

Delete user (requires admin role).

---

## Projects

### GET /projects

List all projects for the authenticated user's organization.

**Query Parameters:**

- `status`: Filter by status (active, completed, on_hold)
- ` clientId`: Filter by client ID
- `page`: Page number
- `limit`: Items per page

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Website Development",
      "description": "Company website development",
      "status": "active",
      "clientId": "uuid",
      "startDate": "2024-01-01",
      "endDate": "2024-06-01",
      "budget": 50000,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### POST /projects

Create a new project.

**Request Body:**

```json
{
  "name": "Website Development",
  "description": "Company website development",
  "clientId": "uuid",
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "budget": 50000
}
```

### GET /projects/:id

Get project details by ID.

**Response:**

```json
{
  "id": "uuid",
  "name": "Website Development",
  "description": "Company website development",
  "status": "active",
  "clientId": "uuid",
  "client": {
    "id": "uuid",
    "name": "Client Company"
  },
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "budget": 50000,
  "progress": 45,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /projects/:id

Update project information.

**Request Body:**

```json
{
  "name": "Updated Project Name",
  "status": "completed",
  "endDate": "2024-05-15"
}
```

### DELETE /projects/:id

Delete project.

### GET /projects/:id/stats

Get project statistics.

**Response:**

```json
{
  "totalTasks": 25,
  "completedTasks": 18,
  "overdueTasks": 2,
  "totalMilestones": 5,
  "completedMilestones": 3,
  "totalFiles": 15,
  "totalApprovals": 8,
  "pendingApprovals": 2
}
```

---

## Tasks

### GET /tasks

List all tasks.

**Query Parameters:**

- `projectId`: Filter by project ID
- `status`: Filter by status
- `assignedTo`: Filter by assignee ID
- `priority`: Filter by priority
- `page`: Page number
- `limit`: Items per page

### POST /tasks

Create a new task.

**Request Body:**

```json
{
  "title": "Implement feature X",
  "description": "Detailed description of the task",
  "projectId": "uuid",
  "assignedTo": "uuid",
  "priority": "high",
  "dueDate": "2024-02-01",
  "estimatedHours": 16
}
```

### GET /tasks/:id

Get task by ID.

### PATCH /tasks/:id

Update task.

**Request Body:**

```json
{
  "status": "completed",
  "actualHours": 18,
  "notes": "Task completed with additional testing"
}
```

### DELETE /tasks/:id

Delete task.

### GET /tasks/status/:status

Find tasks by status.

### GET /tasks/assignee/:assignedTo

Find tasks by assignee.

---

## Milestones

### GET /milestones

List all milestones.

**Query Parameters:**

- `projectId`: Filter by project ID
- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

### POST /milestones

Create a new milestone.

**Request Body:**

```json
{
  "title": "Phase 1 Complete",
  "description": "Complete initial design and development",
  "projectId": "uuid",
  "dueDate": "2024-03-01",
  "deliverables": ["Design mockups", "Core functionality"]
}
```

### GET /milestones/:id

Get milestone by ID.

### PATCH /milestones/:id

Update milestone.

### DELETE /milestones/:id

Delete milestone.

---

## Files

### POST /files

Upload file.

**Request:** multipart/form-data

- `file`: File to upload
- `projectId`: Project ID
- `description`: File description

**Response:**

```json
{
  "id": "uuid",
  "filename": "document.pdf",
  "originalName": "project-document.pdf",
  "size": 1048576,
  "mimeType": "application/pdf",
  "projectId": "uuid",
  "uploadedBy": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /files/download/:id

Download file by ID.

### DELETE /files/:id

Delete file.

---

## Approvals

### GET /approvals

List all approvals.

**Query Parameters:**

- `projectId`: Filter by project ID
- `status`: Filter by status (pending, approved, rejected)
- `requesterId`: Filter by requester ID
- `reviewerId`: Filter by reviewer ID

### POST /approvals

Create approval request.

**Request Body:**

```json
{
  "title": "Design Review",
  "description": "Please review the attached design mockups",
  "projectId": "uuid",
  "reviewerId": "uuid",
  "attachments": ["file-uuid-1", "file-uuid-2"],
  "dueDate": "2024-02-15"
}
```

### GET /approvals/:id

Get approval by ID.

### POST /approvals/:id/approve

Approve request.

**Request Body:**

```json
{
  "comments": "Looks good, approved with minor suggestions"
}
```

### POST /approvals/:id/reject

Reject request.

**Request Body:**

```json
{
  "comments": "Needs revisions before approval"
}
```

---

## Tickets

### GET /tickets

List all tickets.

**Query Parameters:**

- `status`: Filter by status
- `priority`: Filter by priority
- `assignedTo`: Filter by assignee
- `clientId`: Filter by client

### POST /tickets

Create new ticket.

**Request Body:**

```json
{
  "title": "Login Issue",
  "description": "User unable to login to dashboard",
  "priority": "high",
  "clientId": "uuid",
  "categoryId": "uuid"
}
```

### GET /tickets/:id

Get ticket by ID.

### PATCH /tickets/:id

Update ticket.

### DELETE /tickets/:id

Delete ticket.

---

## Invoices

### GET /invoices

List all invoices.

**Query Parameters:**

- `projectId`: Filter by project ID
- `status`: Filter by status (draft, sent, paid, overdue)
- `clientId`: Filter by client ID

### POST /invoices

Create new invoice.

**Request Body:**

```json
{
  "projectId": "uuid",
  "clientId": "uuid",
  "dueDate": "2024-02-15",
  "items": [
    {
      "description": "Development work",
      "quantity": 40,
      "rate": 100,
      "total": 4000
    }
  ],
  "notes": "Payment terms: 30 days"
}
```

### GET /invoices/:id

Get invoice by ID.

### PUT /invoices/:id/pay

Mark invoice as paid.

**Request Body:**

```json
{
  "paymentDate": "2024-02-10",
  "paymentMethod": "bank_transfer",
  "transactionId": "TXN123456"
}
```

### PATCH /invoices/:id

Update invoice.

### DELETE /invoices/:id

Delete invoice.

---

## Knowledge Base

### POST /knowledge-base/categories

Create category.

### GET /knowledge-base/categories

List categories.

### GET /knowledge-base/categories/:id

Get category.

### PATCH /knowledge-base/categories/:id

Update category.

### DELETE /knowledge-base/categories/:id

Delete category.

### POST /knowledge-base/tags

Create tag.

### GET /knowledge-base/tags

List tags.

### POST /knowledge-base/articles

Create article.

### GET /knowledge-base/articles

List articles.

### GET /knowledge-base/articles/:id

Get article.

### GET /knowledge-base/articles/slug/:slug

Get article by slug.

### PATCH /knowledge-base/articles/:id

Update article.

### DELETE /knowledge-base/articles/:id

Delete article.

### POST /knowledge-base/search

Search articles.

### POST /knowledge-base/articles/:id/feedback

Add feedback.

### GET /knowledge-base/analytics

Get analytics.

---

## Analytics

### GET /analytics/projects

Project analytics.

### GET /analytics/team-performance

Team performance analytics.

### GET /analytics/financial

Financial analytics.

### GET /analytics/client-insights

Client insights analytics.

### GET /analytics/activity-trends

Activity trends.

### GET /analytics/overview

Overview analytics.

---

## Dashboard

### GET /dashboard/stats

Dashboard statistics.

### GET /dashboard/recent-activity

Recent activity feed.

### GET /dashboard/projects-overview

Projects overview.

### POST /dashboard/notify-update

Notify dashboard update.

### POST /dashboard/refresh-cache

Refresh cache.

### GET /dashboard/analytics/trends

Analytics trends.

### GET /dashboard/analytics/performance

Performance metrics.

### GET /dashboard/analytics/forecast

Forecast analytics.

### GET /dashboard/analytics/predictive

Predictive analytics.

---

## Health Check

### GET /health

Comprehensive health check.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 86400,
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  }
}
```

### GET /health/database

Database health check.

### GET /health/http

HTTP connectivity check.

---

## Security

### POST /security/scan

Security vulnerability scan.

### GET /security/report/latest

Latest security report.

### GET /security/report/history

Security report history.

### GET /security/package/check

Package security check.

### GET /security/status

Security status overview.

### GET /security/metrics

Security metrics.

---

## Error Responses

All endpoints may return these common error responses:

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "reason": "Invalid email format"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

API endpoints are rate limited:

- **Free tier**: 100 requests per hour
- **Pro tier**: 1000 requests per hour
- **Enterprise**: 10000 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Versioning

API version is included in the URL:

```
https://api.jasaweb.com/api/v1/...
```

Current version: **v1**
