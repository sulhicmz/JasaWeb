# API Documentation

## Overview

JasaWeb provides a RESTful API for managing websites, invoices, and projects. This documentation covers authentication, endpoints, and common use cases.

**Development Base URL**: `http://localhost:4321` (local development)  
**Production Base URL**: `https://your-deployed-domain.com` (your deployed domain)  
**API Version**: v1  
**Content-Type**: `application/json`

## Authentication

All API requests (except public endpoints) require authentication via JWT tokens.

### Obtaining a Token

```bash
# Register (local development)
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Login (local development)
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Note**: For production, replace `http://localhost:4321` with your deployed domain.

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CLIENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the Token

Include the token in the Authorization header:

```bash
# Local development
curl http://localhost:4321/api/client/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Production
curl https://your-deployed-domain.com/api/client/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Client API Endpoints

### Projects

#### List Projects

```bash
GET /api/client/projects?page=1&limit=20&status=active
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (active, completed, cancelled)
- `search` (optional): Search by project name

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "proj_123",
        "name": "School Website",
        "description": "Responsive school website",
        "status": "active",
        "serviceType": "sekolah",
        "pricingPlan": {
          "id": "plan_123",
          "name": "Standard",
          "price": 5000000,
          "duration": 30
        },
        "createdAt": "2025-01-07T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

#### Create Project

```bash
POST /api/client/projects
```

**Request Body**:
```json
{
  "name": "School Website",
  "description": "Responsive school website with admin panel",
  "serviceType": "sekolah",
  "pricingPlanId": "plan_123",
  "requirements": {
    "features": ["student_management", "grade_reports"],
    "customDomain": "school.example.com"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "proj_456",
    "name": "School Website",
    "status": "pending_payment",
    "invoiceId": "inv_789",
    "invoice": {
      "id": "inv_789",
      "amount": 5000000,
      "status": "pending",
      "paymentUrl": "https://app.midtrans.com/payment-link/...",
      "expiresAt": "2025-01-07T14:00:00Z"
    }
  }
}
```

#### Get Project Details

```bash
GET /api/client/projects/{projectId}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "proj_456",
    "name": "School Website",
    "description": "Responsive school website with admin panel",
    "status": "active",
    "serviceType": "sekolah",
    "pricingPlan": {
      "id": "plan_123",
      "name": "Standard",
      "price": 5000000,
      "duration": 30
    },
    "requirements": {
      "features": ["student_management", "grade_reports"],
      "customDomain": "school.example.com"
    },
    "invoice": {
      "id": "inv_789",
      "amount": 5000000,
      "status": "paid",
      "paidAt": "2025-01-07T11:30:00Z"
    },
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T12:00:00Z"
  }
}
```

### Invoices

#### List Invoices

```bash
GET /api/client/invoices?page=1&limit=20&status=paid
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (pending, paid, failed, expired)

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "inv_789",
        "projectId": "proj_456",
        "projectName": "School Website",
        "amount": 5000000,
        "status": "paid",
        "paymentMethod": "qris",
        "paidAt": "2025-01-07T11:30:00Z",
        "createdAt": "2025-01-07T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Get Invoice Details

```bash
GET /api/client/invoices/{invoiceId}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "inv_789",
    "projectId": "proj_456",
    "projectName": "School Website",
    "amount": 5000000,
    "status": "paid",
    "paymentMethod": "qris",
    "paymentDetails": {
      "transactionId": "TXN123456789",
      "paymentType": "qris",
      "bank": "",
      "vaNumber": ""
    },
    "paidAt": "2025-01-07T11:30:00Z",
    "expiresAt": "2025-01-07T14:00:00Z",
    "createdAt": "2025-01-07T10:00:00Z"
  }
}
```

#### Create Invoice for Project

```bash
POST /api/client/invoices
```

**Request Body**:
```json
{
  "projectId": "proj_456"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "inv_790",
    "projectId": "proj_456",
    "amount": 5000000,
    "status": "pending",
    "paymentUrl": "https://app.midtrans.com/payment-link/...",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "expiresAt": "2025-01-07T14:00:00Z",
    "createdAt": "2025-01-07T12:00:00Z"
  }
}
```

#### Get Payment QR Code

```bash
GET /api/client/payment?invoiceId=inv_790
```

**Response**:
```json
{
  "success": true,
  "data": {
    "invoiceId": "inv_790",
    "amount": 5000000,
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "paymentUrl": "https://app.midtrans.com/payment-link/...",
    "expiresAt": "2025-01-07T14:00:00Z",
    "status": "pending"
  }
}
```

### Dashboard

#### Get Dashboard Stats

```bash
GET /api/client/dashboard
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalProjects": 5,
    "activeProjects": 3,
    "completedProjects": 2,
    "pendingInvoices": 1,
    "totalRevenue": 15000000,
    "recentProjects": [
      {
        "id": "proj_456",
        "name": "School Website",
        "status": "active",
        "createdAt": "2025-01-07T10:00:00Z"
      }
    ],
    "recentInvoices": [
      {
        "id": "inv_789",
        "amount": 5000000,
        "status": "paid",
        "paidAt": "2025-01-07T11:30:00Z"
      }
    ]
  }
}
```

### Account

#### Get Profile

```bash
GET /api/client/profile
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+628123456789",
    "role": "CLIENT",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### Update Profile

```bash
PUT /api/client/profile
```

**Request Body**:
```json
{
  "name": "John Smith",
  "phone": "+628123456789"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+628123456789",
    "role": "CLIENT"
  }
}
```

#### Change Password

```bash
PUT /api/client/password
```

**Request Body**:
```json
{
  "currentPassword": "securePassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Public Endpoints

### Pricing Plans

```bash
GET /api/pricing-plans?serviceType=sekolah
```

**Query Parameters**:
- `serviceType` (optional): Filter by service type (sekolah, berita, company)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_123",
      "name": "Standard",
      "serviceType": "sekolah",
      "price": 5000000,
      "duration": 30,
      "description": "Complete school website with admin panel",
      "features": [
        "Responsive design",
        "Admin panel",
        "Student management",
        "Grade reports"
      ],
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```

### Templates

```bash
GET /api/templates?serviceType=sekolah&category=basic
```

**Query Parameters**:
- `serviceType` (optional): Filter by service type
- `category` (optional): Filter by category
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "tmpl_123",
        "name": "Modern School Template",
        "description": "Clean and modern school website template",
        "serviceType": "sekolah",
        "category": "basic",
        "thumbnail": "https://cdn.jasaweb.com/templates/...",
        "previewUrl": "https://templates.jasaweb.com/...",
        "isActive": true,
        "sortOrder": 1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

## Admin API Endpoints

### Dashboard

```bash
GET /api/admin/dashboard
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalProjects": 320,
    "totalRevenue": 1500000000,
    "activeProjects": 245,
    "pendingInvoices": 15,
    "monthlyRevenue": 125000000,
    "recentUsers": [...],
    "recentProjects": [...]
  }
}
```

### Users Management

#### List Users
```bash
GET /api/admin/users?page=1&limit=20&role=CLIENT
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Create User
```bash
POST /api/admin/users
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "CLIENT",
  "phone": "+628123456789"
}
```

#### Update User
```bash
PUT /api/admin/users/{userId}
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "name": "John Smith",
  "role": "ADMIN"
}
```

#### Delete User
```bash
DELETE /api/admin/users/{userId}
Authorization: Bearer ADMIN_JWT_TOKEN
```

### Projects Management

#### List Projects
```bash
GET /api/admin/projects?page=1&limit=20&status=active
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Update Project Status
```bash
PUT /api/admin/projects/{projectId}
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "status": "completed",
  "notes": "Project completed successfully"
}
```

### Templates Management

#### List Templates
```bash
GET /api/admin/templates?page=1&limit=20&serviceType=sekolah
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Create Template
```bash
POST /api/admin/templates
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "name": "Modern School Template",
  "description": "Clean and modern school website",
  "serviceType": "sekolah",
  "category": "basic",
  "thumbnail": "https://cdn.example.com/thumb.jpg",
  "previewUrl": "https://templates.example.com/preview",
  "isActive": true,
  "sortOrder": 1
}
```

#### Update Template
```bash
PUT /api/admin/templates/{templateId}
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Delete Template
```bash
DELETE /api/admin/templates/{templateId}
Authorization: Bearer ADMIN_JWT_TOKEN
```

### Pricing Plans Management

#### List Pricing Plans
```bash
GET /api/admin/pricing?page=1&limit=20&serviceType=sekolah
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Create Pricing Plan
```bash
POST /api/admin/pricing
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "name": "Standard",
  "serviceType": "sekolah",
  "price": 5000000,
  "duration": 30,
  "description": "Complete school website with admin panel",
  "features": ["Responsive design", "Admin panel", "Student management"],
  "isActive": true,
  "sortOrder": 1
}
```

### Webhook Queue Management

#### Get Webhook Statistics
```bash
GET /api/admin/webhooks
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pending": 5,
    "processing": 2,
    "completed": 150,
    "failed": 3,
    "expired": 1,
    "successRate": 96.8,
    "averageProcessingTime": 245.3
  }
}
```

#### Retry Failed Webhooks
```bash
POST /api/admin/webhooks
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "webhookIds": ["webhook_1", "webhook_2", "webhook_3"]
}
```

### Job Queue Management

#### List Jobs
```bash
GET /api/admin/jobs?page=1&limit=20&status=PENDING
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Create Job
```bash
POST /api/admin/jobs
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "type": "NOTIFICATION",
  "priority": "HIGH",
  "payload": {
    "userId": "user_123",
    "message": "Your invoice is ready"
  }
}
```

#### Process Jobs
```bash
POST /api/admin/jobs/process
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "maxJobs": 10,
  "jobType": "NOTIFICATION"
}
```

#### Get Job Statistics
```bash
GET /api/admin/jobs/stats
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pending": 15,
    "processing": 5,
    "completed": 450,
    "failed": 12,
    "cancelled": 2,
    "retrying": 3,
    "queueHealth": 92.5,
    "successRate": 94.2
  }
}
```

### Business Intelligence APIs

#### Revenue Analytics
```bash
GET /api/admin/bi/revenue?period=7d
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### User Analytics
```bash
GET /api/admin/bi/users?period=30d
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Project Analytics
```bash
GET /api/admin/bi/projects?period=7d
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### BI Summary
```bash
GET /api/admin/bi/summary
Authorization: Bearer ADMIN_JWT_TOKEN
```

### Performance Monitoring

#### System Performance
```bash
GET /api/admin/performance
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
    "bundleSize": {
      "total": 189710,
      "gzip": 60750,
      "brotli": 58920
    },
    "apiPerformance": {
      "averageResponseTime": 45.2,
      "errorRate": 0.01,
      "throughput": 987.65
    },
    "systemHealth": "HEALTHY"
  }
}
```

#### Performance Intelligence
```bash
GET /api/admin/performance-intelligence
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Cache Management
```bash
GET /api/admin/cache
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### Cache Invalidation
```bash
POST /api/admin/cache-manage
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "action": "invalidate",
  "pattern": "dashboard:*"
}
```

#### Cache Warming
```bash
POST /api/admin/cache-manage
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "action": "warm"
}
```

## System Health Monitoring

### Health Check Endpoint

```bash
GET /api/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-08T12:00:00Z",
    "uptime": 86400,
    "database": {
      "status": "connected",
      "latency": 1.2
    },
    "cache": {
      "status": "connected",
      "hitRate": 0.89
    },
    "services": {
      "midtrans": {
        "status": "operational",
        "lastCheck": "2026-01-08T11:59:00Z"
      }
    }
  }
}
```

### OpenAPI Documentation

#### Get OpenAPI Specification

```bash
GET /api/docs
Accept: application/json
```

#### Interactive API Documentation

Visit `/docs` in your browser for interactive Swagger UI documentation.

## Error Handling

All API responses follow a consistent error format:

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

**Common HTTP Status Codes**:
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Common Error Codes**:
- `VALIDATION_ERROR`: Invalid request parameters
- `AUTHENTICATION_FAILED`: Invalid credentials
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `PAYMENT_FAILED`: Payment processing error
- `WEBHOOK_INVALID`: Invalid webhook signature

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated requests**: 100 requests per minute
- **Unauthenticated requests**: 20 requests per minute
- **Sensitive endpoints** (auth, payment): Stricter limits apply

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704607200
```

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## CSRF Protection

All authenticated state-changing requests (POST, PUT, DELETE, PATCH) must include a CSRF token in the `x-csrf-token` header.

**How to get CSRF token**:
- The token is stored in the `jasaweb_csrf` cookie
- Include the token in your request headers:

```bash
curl -X POST http://localhost:4321/api/client/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Project"}'
```

**CSRF Validation Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "CSRF_TOKEN_INVALID",
    "message": "Invalid or missing CSRF token"
  }
}
```

**Note**: CSRF protection is enforced for authenticated state-changing operations to prevent cross-site request forgery attacks.

## Webhooks

Webhooks allow you to receive real-time notifications about payment status changes.

### Configuring Webhooks

Webhooks can be configured through the admin panel or API.

### Webhook Payload

**Payment Status Change**:
```json
{
  "event": "payment.status.changed",
  "timestamp": "2025-01-07T11:30:00Z",
  "data": {
    "invoiceId": "inv_789",
    "projectId": "proj_456",
    "status": "paid",
    "amount": 5000000,
    "transactionId": "TXN123456789"
  }
}
```

### Webhook Security

Webhooks are signed with SHA-512 HMAC. Verify the signature:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## HTTP Client Examples

### JavaScript/Node.js

```javascript
// Using fetch API
async function getProjects(token) {
  const response = await fetch('http://localhost:4321/api/client/projects', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data;
}

// Create project
async function createProject(token, projectData) {
  const response = await fetch('http://localhost:4321/api/client/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });
  const data = await response.json();
  return data;
}
```

### Python

```python
import requests

BASE_URL = 'http://localhost:4321'  # Update to production URL in deployment

def get_projects(token):
    response = requests.get(
        f'{BASE_URL}/api/client/projects',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    return response.json()

def create_project(token, project_data):
    response = requests.post(
        f'{BASE_URL}/api/client/projects',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json=project_data
    )
    return response.json()
```

## Testing

Use the local development environment for testing:

- **Development Base URL**: `http://localhost:4321`
- **Development Server**: Start with `pnpm dev`
- **Test Payments**: Use Midtrans sandbox credentials in `.dev.vars`

```bash
# Example: Create project in local development
curl -X POST http://localhost:4321/api/client/projects \
  -H "Authorization: Bearer YOUR_DEV_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School Website",
    "serviceType": "sekolah",
    "pricingPlanId": "plan_123"
  }'
```

**Test Environment Setup**:
1. Copy `.dev.vars.example` to `.dev.vars`
2. Set up Neon PostgreSQL database
3. Use Midtrans sandbox credentials (SB-Mid-server-...)
4. Run `pnpm db:push` to set up database
5. Start dev server with `pnpm dev`

## Support

- **Documentation**: [README.md](../../README.md)
- **Architecture**: [Architecture Blueprint](blueprint.md)
- **Deployment**: [Cloudflare Setup](deployment/SETUP.md)
- **GitHub Repository**: https://github.com/sulhicmz/jasaweb
- **GitHub Issues**: https://github.com/sulhicmz/jasaweb/issues
- **Task Progress**: [Task Checklist](task.md)

---

**Last Updated**: 2026-01-08
**API Version**: v1
