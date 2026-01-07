# API Documentation

## Overview

JasaWeb provides a RESTful API for managing websites, invoices, and projects. This documentation covers authentication, endpoints, and common use cases.

**Base URL**: `https://api.jasaweb.com`  
**API Version**: v1  
**Content-Type**: `application/json`

## Authentication

All API requests (except public endpoints) require authentication via JWT tokens.

### Obtaining a Token

```bash
# Register
curl -X POST https://api.jasaweb.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Login
curl -X POST https://api.jasaweb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

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
curl https://api.jasaweb.com/api/client/projects \
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

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704607200
```

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

## SDK Examples

### JavaScript/Node.js

```javascript
const JasaWebClient = require('jasaweb-sdk');

const client = new JasaWebClient({
  apiKey: 'YOUR_API_KEY'
});

// List projects
const projects = await client.projects.list();

// Create project
const project = await client.projects.create({
  name: 'School Website',
  serviceType: 'sekolah',
  pricingPlanId: 'plan_123'
});

// Get invoice
const invoice = await client.invoices.get('inv_789');
```

### Python

```python
from jasaweb import JasaWebClient

client = JasaWebClient(api_key='YOUR_API_KEY')

# List projects
projects = client.projects.list()

# Create project
project = client.projects.create(
    name='School Website',
    service_type='sekolah',
    pricing_plan_id='plan_123'
)

# Get invoice
invoice = client.invoices.get('inv_789')
```

## Testing

Use the sandbox environment for testing:

- **Sandbox Base URL**: `https://sandbox-api.jasaweb.com`
- **Test Credentials**: Create test account in sandbox
- **Test Payments**: Use Midtrans sandbox for payment testing

```bash
# Example: Create project in sandbox
curl -X POST https://sandbox-api.jasaweb.com/api/client/projects \
  -H "Authorization: Bearer SANDBOX_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School Website",
    "serviceType": "sekolah",
    "pricingPlanId": "plan_123"
  }'
```

## Support

- **Documentation**: https://docs.jasaweb.com
- **API Reference**: https://docs.jasaweb.com/api
- **Support Email**: support@jasaweb.com
- **GitHub Issues**: https://github.com/jasaweb/jasaweb/issues

---

**Last Updated**: 2025-01-07
**API Version**: v1
