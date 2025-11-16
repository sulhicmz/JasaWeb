# 🌐 JasaWeb - Web Development Service Platform

<div align="center">

![JasaWeb Logo](https://via.placeholder.com/200x80/0075ca/ffffff?text=JasaWeb)

**Professional Web Development Service Platform with Client Portal**

[![CI/CD Pipeline](https://github.com/sulhicmz/JasaWeb/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/sulhicmz/JasaWeb/actions)
[![Security Scan](https://github.com/sulhicmz/JasaWeb/workflows/Security%20Scan/badge.svg)](https://github.com/sulhicmz/JasaWeb/actions)
[![codecov](https://codecov.io/gh/sulhicmz/JasaWeb/branch/main/graph/badge.svg)](https://codecov.io/gh/sulhicmz/JasaWeb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

## 📖 About

JasaWeb is a comprehensive web development service platform that combines a marketing website with a powerful client portal. It's designed to streamline the process of delivering website development services for schools, news portals, and company profiles.

### 🎯 Business Goals

- Generate qualified leads for 3 main services: School Websites, News Portals, Company Profiles
- Accelerate client collaboration through an integrated Client Portal
- Standardize delivery processes to reduce project cycle time to 8-10 weeks
- Achieve 5-8% conversion from landing page to contact form

## 🏗️ Architecture

### Monorepo Structure

```
jasaweb/
├── apps/
│   ├── web/           # 🎨 Astro marketing site
│   └── api/           # 🔧 NestJS client portal API
├── packages/
│   ├── ui/            # 🎭 Shared UI components
│   ├── config/        # ⚙️ Shared configurations
│   └── testing/       # 🧪 Testing utilities
├── docs/              # 📚 Project documentation
├── .github/           # 🤖 GitHub workflows & templates
└── tests/             # 🧪 Integration & E2E tests
```

### Technology Stack

| Component           | Technology   | Version |
| ------------------- | ------------ | ------- |
| **Frontend**        | Astro        | ^4.0.0  |
| **Backend**         | NestJS       | ^10.0.0 |
| **Database**        | PostgreSQL   | 15+     |
| **ORM**             | Prisma       | ^6.16.3 |
| **Language**        | TypeScript   | ^5.0.0  |
| **Package Manager** | pnpm         | ^8.15.0 |
| **Styling**         | Tailwind CSS | ^4.1.17 |
| **Testing**         | Vitest       | ^1.0.0  |
| **Container**       | Docker       | Latest  |

### 🔄 Recent Migration: Tailwind CSS v4

This project has been migrated from the deprecated `@astrojs/tailwind` integration to Tailwind CSS v4 with the native Vite plugin:

- **Before**: Used `@astrojs/tailwind` integration (deprecated)
- **After**: Uses `@tailwindcss/vite` plugin with Tailwind CSS v4
- **Benefits**: Better performance, smaller bundle size, latest Tailwind features
- **Impact**: No breaking changes - existing Tailwind classes continue to work

The migration includes:

- Updated `astro.config.mjs` to use the Vite plugin
- Updated CSS imports to use the new v4 syntax (`@import 'tailwindcss'`)
- Removed dependency on the deprecated Astro integration

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (use `.nvmrc` for version consistency)
- **pnpm** package manager (enable with `corepack enable`)
- **Docker** and Docker Compose for local development
- **PostgreSQL** 15+ (handled by Docker Compose)
- **VS Code** (recommended IDE with provided configuration)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sulhicmz/JasaWeb.git
   cd JasaWeb
   ```

2. **Setup Node.js and pnpm**

   ```bash
   # Install and use correct Node.js version
   nvm use

   # Enable pnpm
   corepack enable
   pnpm --version
   ```

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Environment setup**

   ```bash
   # Copy environment templates
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env

   # Edit environment files with your configuration
   # See Environment Configuration section below
   ```

5. **Start development services**

   ```bash
   # Start database and other services
   docker-compose up -d

   # Run database migrations
   pnpm db:migrate

   # Seed database (optional)
   pnpm db:seed
   ```

6. **Start development servers**

   ```bash
   # Start all applications in development mode
   pnpm dev

   # Or start individual applications
   pnpm dev:web    # Marketing site at http://localhost:4321
   pnpm dev:api    # API at http://localhost:3000
   ```

### IDE Setup (VS Code)

JasaWeb provides pre-configured VS Code settings for an optimal development experience:

1. **Recommended Extensions**: Install the recommended extensions by opening the command palette (Ctrl+Shift+P) and running "Extensions: Show Recommended Extensions"

2. **Settings**: The project includes pre-configured settings for:
   - Auto-formatting on save
   - ESLint integration
   - TypeScript auto-imports
   - Prisma syntax highlighting
   - Debug configurations for both API and Web applications

3. **Debugging**: Use the pre-configured debug configurations:
   - "Debug API" - Debug the NestJS API application
   - "Debug Web" - Debug the Astro web application

4. **Tasks**: Run common development tasks directly from VS Code:
   - "dev-api" - Start API in development mode
   - "dev-web" - Start Web application in development mode
   - "build-api" - Build API application
   - "build-web" - Build Web application

### Verify Installation

- 🌐 **Marketing Site**: [http://localhost:4321](http://localhost:4321)
- 🔧 **API Documentation**: [http://localhost:3000/api](http://localhost:3000/api)
- 🗄️ **Database**: localhost:5432 (via Docker)
- 📊 **API Health**: [http://localhost:3000/health](http://localhost:3000/health)

## ⚙️ Environment Configuration

### Required Environment Variables

#### Root `.env`

```bash
# Application
NODE_ENV=development
PORT=4321

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/jasaweb

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Storage
S3_BUCKET=jasaweb-storage
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

#### API Environment (`apps/api/.env`)

```bash
# API Configuration
API_PORT=3000
API_PREFIX=api

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:4321
```

#### Web Environment (`apps/web/.env`)

```bash
# Site Configuration
SITE_URL=http://localhost:4321
SITE_NAME=JasaWeb
SITE_DESCRIPTION=Professional Web Development Services

# Analytics (optional)
GOOGLE_ANALYTICS_ID=
GOOGLE_TAG_MANAGER_ID=

# Contact Form
CONTACT_EMAIL=contact@jasaweb.com
```

## 🛠️ Development Commands

### Package Scripts

```bash
# Development
pnpm dev              # Start all applications
pnpm dev:web          # Start web application only
pnpm dev:api          # Start API only

# Building
pnpm build            # Build all applications
pnpm build:web        # Build web application only
pnpm build:api        # Build API only

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests only
pnpm test:e2e         # Run end-to-end tests
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format code with Prettier
pnpm typecheck        # Run TypeScript checks

# Database
pnpm db:migrate       # Run database migrations
pnpm db:generate      # Generate Prisma client
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Prisma Studio
pnpm db:reset         # Reset database

# Docker
pnpm docker:up        # Start Docker services
pnpm docker:down      # Stop Docker services
pnpm docker:logs      # View Docker logs

# Development Tools
pnpm dev-tools:watch  # Watch for file changes and reload
pnpm dev-tools:db     # Database management tools
pnpm dev-tools:quality # Code quality tools
```

### Development Tools

JasaWeb includes several development tools to improve productivity:

1. **File Watcher**: Automatically rebuild and reload applications when files change

   ```bash
   # Watch all applications
   ./scripts/dev-tools/watch-and-reload.sh all

   # Watch API only
   ./scripts/dev-tools/watch-and-reload.sh api

   # Watch Web only
   ./scripts/dev-tools/watch-and-reload.sh web
   ```

2. **Database Tools**: Simplify database operations

   ```bash
   # Reset database (WARNING: Deletes all data)
   ./scripts/dev-tools/database-tools.sh reset

   # Create new migration
   ./scripts/dev-tools/database-tools.sh migrate "migration-name"

   # Run pending migrations
   ./scripts/dev-tools/database-tools.sh up

   # Open Prisma Studio
   ./scripts/dev-tools/database-tools.sh studio

   # Generate Prisma client
   ./scripts/dev-tools/database-tools.sh generate
   ```

3. **Code Quality Tools**: Run checks and fix issues

   ```bash
   # Run all code quality checks
   ./scripts/dev-tools/code-quality.sh all

   # Fix code issues
   ./scripts/dev-tools/code-quality.sh fix

   # Run specific check (lint, types, test, security, format)
   ./scripts/dev-tools/code-quality.sh check lint
   ```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── fixtures/         # Test data and mocks
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test apps/api/src/auth/auth.service.spec.ts

# Run E2E tests
pnpm test:e2e
```

### Coverage Requirements

- **Minimum Coverage**: 80%
- **Critical Paths**: 95%
- **Unit Tests**: All business logic
- **Integration Tests**: API endpoints
- **E2E Tests**: User workflows

## 📊 API Documentation

### Available Endpoints

#### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - User logout

#### Projects

- `GET /projects` - List projects (summary view)
- `GET /projects?view=detail` - List projects (detailed view)
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

#### Health Check

- `GET /health` - Application health status

### API Documentation

- **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **OpenAPI Spec**: [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)

## 🚀 Deployment

### Environment Setup

| Environment | URL                 | Branch    | Description            |
| ----------- | ------------------- | --------- | ---------------------- |
| Development | dev.jasaweb.com     | develop   | Development testing    |
| Staging     | staging.jasaweb.com | main      | Pre-production testing |
| Production  | jasaweb.com         | main/tags | Live production        |

### Deployment Process

1. **Automated Deployment** (via GitHub Actions)
   - Push to `develop` → Deploy to Development
   - Push to `main` → Deploy to Staging
   - Create release tag → Deploy to Production

2. **Cloudflare Pages Deployment**
   - Build command: `pnpm build:web`
   - Build output directory: `apps/web/dist`
   - Custom domains can be configured in Cloudflare dashboard

3. **Manual Deployment** (if needed)

```bash
# Build for production
pnpm build

# Build for Cloudflare Pages
cd apps/web && pnpm cf-build
```

### Infrastructure Requirements

- **Node.js** 20+ runtime
- **PostgreSQL** 15+ database
- **Redis** for caching (optional)
- **S3-compatible** storage
- **CDN** for static assets
- **Load balancer** for high availability

## 🔧 Configuration

### Database Configuration

The application uses PostgreSQL with Prisma ORM. Key configurations:

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Multi-tenancy Support

The application supports multi-tenancy via organization-based data isolation:

```typescript
// Automatic tenant filtering
@MultiTenant() // Automatically adds organization_id filter
async findProjects() {
  return this.prisma.project.findMany();
}
```

## 📈 Performance Optimizations

### Recent Improvements

- **Project Summary Queries**: Optimized `GET /projects` to return summary data by default
- **Aggregation Queries**: Use Prisma aggregations for metrics calculation
- **Multi-tenant Helper**: Added reusable count helper for tenant-specific queries
- **Connection Pooling**: Optimized database connection management

### Performance Metrics

- **API Response Time**: < 200ms (average)
- **Database Query Time**: < 50ms (average)
- **Page Load Time**: < 2s (First Contentful Paint)
- **Build Time**: < 2 minutes (full build)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Write tests for new features
- Update documentation for API changes
- Ensure all CI checks pass

## 📚 Documentation

- [📋 Project Plan](./plan.md) - Detailed specifications and roadmap
- [🏢 Client Management System](./docs/client-management-system.md) - Complete system documentation
- [🤖 Agent Guidelines](./AGENTS.md) - Development conventions
- [🔧 Optimization Plan](./docs/optimization-plan.md) - Performance improvements
- [🛡️ Security Policy](./SECURITY.md) - Security guidelines
- [📄 Code of Conduct](./CODE_OF_CONDUCT.md) - Community guidelines
- [☁️ Cloudflare Pages Deployment](./docs/deployment/cloudflare-pages.md) - Deployment guide

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check Docker containers
docker-compose ps

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### Dependency Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Build Issues

```bash
# Clear build cache
pnpm clean

# Check TypeScript
pnpm typecheck

# Check linting
pnpm lint
```

### Getting Help

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/sulhicmz/JasaWeb/issues)
- 💬 [Discussions](https://github.com/sulhicmz/JasaWeb/discussions)
- 📧 [Email Support](mailto:support@jasaweb.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Astro](https://astro.build/) - The modern web framework
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager

---

<div align="center">

**Built with ❤️ by the JasaWeb Team**

[🌐 Website](https://jasaweb.com) • [📧 Email](mailto:hello@jasaweb.com) • [💬 Discord](https://discord.gg/jasaweb)

</div>
