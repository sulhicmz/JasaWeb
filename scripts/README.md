# Development Scripts

This directory contains utility scripts to help with JasaWeb development.

## 🚀 Setup Scripts

### `setup.sh` (Linux/macOS)

Complete development environment setup script that:

- Checks system requirements (Node.js 20+, pnpm, Docker, Git)
- Sets up environment files from templates
- Installs dependencies
- Configures and starts database
- Runs migrations and optional seeding
- Builds applications
- Runs tests
- Sets up Git hooks
- Verifies the setup

**Usage:**

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### `setup.bat` (Windows)

Windows batch script equivalent of `setup.sh`.

**Usage:**

```cmd
scripts\setup.bat
```

### `quick-start.sh` (Linux/macOS)

Fast setup for experienced developers who want to get running quickly.

**Usage:**

```bash
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

## 🛠️ Utility Scripts

### Database Management

```bash
# Run migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Seed database with sample data
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio

# Reset database (destructive)
pnpm db:reset
```

### Development Commands

```bash
# Start all applications
pnpm dev

# Start specific applications
pnpm dev:web    # Marketing site
pnpm dev:api    # API server

# Build for production
pnpm build

# Run tests
pnpm test
pnpm test:run
pnpm test:watch
pnpm test:coverage

# Code quality
pnpm lint
pnpm lint:fix
pnpm format
pnpm typecheck
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs

# Rebuild services
docker-compose up --build
```

## 📝 Environment Setup

### Required Environment Variables

Create these files from their `.example` counterparts:

#### Root `.env`

```bash
# Application
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/jasaweb

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Email
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

#### API `apps/api/.env`

```bash
API_PORT=3000
API_PREFIX=api
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:4321
```

#### Web `apps/web/.env`

```bash
SITE_URL=http://localhost:4321
SITE_NAME=JasaWeb
SITE_DESCRIPTION=Professional Web Development Services
CONTACT_EMAIL=contact@jasaweb.com
```

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts

If ports are already in use:

```bash
# Check what's using ports
lsof -i :3000  # API port
lsof -i :4321  # Web port
lsof -i :5432  # Database port

# Kill processes if needed
kill -9 <PID>
```

#### Database Connection Issues

```bash
# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
pnpm db:migrate
```

#### Permission Issues (Linux/macOS)

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix Docker permissions
sudo usermod -aG docker $USER
# Then log out and back in
```

#### Node.js Version Issues

```bash
# Use correct Node.js version with nvm
nvm use
nvm install 20  # if not installed

# Set default version
nvm alias default 20
```

### Clean Setup

If you need to start fresh:

```bash
# Clean everything
docker-compose down -v
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm pnpm-lock.yaml

# Reinstall
./scripts/setup.sh
```

## 🚀 Quick Development Workflow

1. **Initial Setup** (one time):

   ```bash
   ./scripts/setup.sh
   ```

2. **Daily Development**:

   ```bash
   # Start services
   docker-compose up -d

   # Start development
   pnpm dev
   ```

3. **Making Changes**:

   ```bash
   # Run tests
   pnpm test

   # Check code quality
   pnpm lint
   pnpm typecheck

   # Format code
   pnpm format
   ```

4. **Before Commit**:
   ```bash
   # Run full check
   pnpm lint && pnpm typecheck && pnpm test:run
   ```

## 📚 Additional Resources

- [Main Documentation](../README.md)
- [API Documentation](../apps/api/README.md)
- [Web Documentation](../apps/web/README.md)
- [Database Schema](../apps/api/prisma/schema.prisma)
- [Troubleshooting Guide](../docs/troubleshooting.md)
