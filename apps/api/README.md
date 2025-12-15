# JasaWeb API

NestJS-based API server for the JasaWeb client portal.

## Overview

This API provides the backend services for:

- Authentication and authorization (multi-tenant)
- Project management and milestones
- File management and approval workflows
- Ticket system and invoice management
- Knowledge base and analytics
- Real-time dashboard updates

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Multi-tenancy**: Organization-based data isolation
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.15.0
- PostgreSQL database

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

3. Generate Prisma client:

   ```bash
   pnpm db:generate
   ```

4. Run database migrations:

   ```bash
   pnpm db:migrate
   ```

5. Seed database (optional):

   ```bash
   pnpm db:seed
   ```

6. Start development server:
   ```bash
   pnpm start:dev
   ```

### Available Scripts

- `pnpm start:dev` - Start in development mode with hot reload
- `pnpm build` - Build the application
- `pnpm start:prod` - Start production build
- `pnpm lint` - Run ESLint
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm test:cov` - Run tests with coverage

### Database Commands

- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:reset` - Reset database

## API Documentation

When running in development mode, Swagger documentation is available at:

```
http://localhost:3000/api
```

## Project Structure

```
src/
├── common/           # Shared utilities and configurations
├── auth/             # Authentication and authorization
├── users/            # User management
├── projects/         # Project management
├── milestones/       # Milestone tracking
├── files/            # File management
├── approvals/        # Approval workflows
├── tickets/          # Ticket system
├── invoices/         # Invoice management
├── knowledge-base/   # Knowledge base functionality
├── analytics/        # Analytics and reporting
├── dashboard/        # Real-time dashboard updates
└── health/           # Health check endpoints
```

## Key Features

### Multi-tenancy

- Organization-based data isolation
- Tenant-specific middleware and guards
- Multi-tenant database design

### Security

- JWT authentication with refresh tokens
- Role-based access control
- Rate limiting and CORS
- Input validation and sanitization
- Audit logging

### Real-time Features

- WebSocket support for dashboard updates
- Real-time notifications
- Live project status updates

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `REDIS_URL` - Redis connection for caching
- `AWS_ACCESS_KEY_ID` - AWS S3 credentials
- `AWS_SECRET_ACCESS_KEY` - AWS S3 credentials

## Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests

```bash
pnpm test:integration
```

### E2E Tests

```bash
pnpm test:e2e
```

### Coverage

```bash
pnpm test:cov
```

## Deployment

### Build

```bash
pnpm build
```

### Production Start

```bash
pnpm start:prod
```

### Docker

```bash
docker build -t jasaweb-api .
docker run -p 3000:3000 jasaweb-api
```

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to this project.

## Support

For support, please contact:

- Create an issue in the GitHub repository
- Email: support@jasaweb.com
