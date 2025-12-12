# Security Setup Guide

## 🔐 Required Environment Variables

This application requires the following security environment variables to be set:

### Critical Security Secrets

**All secrets must be strong, random strings with the specified minimum lengths:**

```bash
# JWT Configuration (REQUIRED)
JWT_SECRET=your-32-character-random-string
JWT_REFRESH_SECRET=your-32-character-random-string

# Session Configuration (REQUIRED)
SESSION_SECRET=your-32-character-random-string

# Encryption Configuration (REQUIRED)
ENCRYPTION_KEY=exactly-32-characters-long-key

# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database
```

## 🛡️ Security Requirements

### Secret Generation

Generate strong secrets using one of these methods:

**Using OpenSSL (Recommended):**

```bash
# Generate 32-character JWT secrets
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# Generate 32-character encryption key
openssl rand -hex 16
```

**Using Node.js:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32))"
```

**Using Python:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32)[:32])"
```

### Validation Rules

- **JWT Secrets**: Minimum 32 characters, no common patterns, no placeholder values
- **Session Secret**: Minimum 32 characters, high entropy, hexadecimal format
- **Encryption Key**: Exactly 32 characters, hexadecimal format (AES-256 requirement)
- **Database URL**: Valid PostgreSQL connection string, no default credentials

## 🔒 Security Improvements Implemented

### 1. Removed Hardcoded Credentials

- Eliminated hardcoded database credentials from build scripts
- Implemented secure environment variable validation
- Added comprehensive build-time security checks

### 2. Enhanced Environment Validation

- Database URL format validation
- JWT secret strength validation
- Detection of placeholder/default values
- Production-specific security requirements

### 3. Secure Build Process

- New `scripts/build.js` with comprehensive validation
- Fails fast on missing or invalid configuration
- Provides clear error messages and guidance
- Prevents deployment with insecure settings

## ⚠️ Security Notes

1. **Never commit secrets to version control**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly in production**
4. **Store secrets securely (AWS Secrets Manager, Azure Key Vault, etc.)**
5. **Application will fail to start/build without required secrets**
6. **Build process validates all security configurations**

## 🚀 Quick Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Generate and update the required secrets in your `.env` file

3. Build the application with security validation:

   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm run start:dev
   ```

The application will validate all security secrets on startup and fail with clear error messages if any are missing or invalid.

## 🛠️ Build Process Security

The new secure build script (`scripts/build.js`) ensures:

- ✅ Environment variables are properly loaded and validated
- ✅ Database URL is available for Prisma generation
- ✅ Sensitive credentials are never hardcoded
- ✅ Build fails fast if required environment is missing
- ✅ Security warnings for weak configurations
- ✅ Production-specific security checks

## 📋 Security Checklist

Before deploying to production:

- [ ] All required environment variables are set
- [ ] JWT secrets are 32+ characters and don't contain placeholder values
- [ ] Database URL doesn't use localhost in production
- [ ] Encryption key is set (32-character hex string)
- [ ] No default/example values are used
- [ ] Build process completes without security warnings
- [ ] Secrets are stored in secure secret management system
