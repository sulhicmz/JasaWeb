# Security Configuration Guide

## 🚨 Critical Security Requirements

This document outlines the security configuration requirements for JasaWeb, particularly focusing on credential management and environment variable security.

## Hardcoded Credential Removal

As of the latest security update, **all hardcoded credentials have been removed** from the codebase. The following changes were made:

### Before (VULNERABLE)

```typescript
// apps/api/src/common/config/constants.ts
export const DEFAULT_DATABASE_CONFIG = {
  USER: 'test', // ❌ HARDCODED
  PASSWORD: 'test', // ❌ HARDCODED
  DATABASE: 'test', // ❌ HARDCODED
  URL: 'postgresql://test:test@localhost:5432/test', // ❌ HARDCODED
} as const;
```

### After (SECURE)

```typescript
export const DEFAULT_DATABASE_CONFIG = {
  HOST: process.env.POSTGRES_HOST || 'localhost',
  PORT: Number(process.env.POSTGRES_PORT) || DEFAULT_PORTS.DATABASE,
  USER: process.env.POSTGRES_USER, // ✅ From environment
  PASSWORD: process.env.POSTGRES_PASSWORD, // ✅ From environment
  DATABASE: process.env.POSTGRES_DB, // ✅ From environment
  URL: process.env.DATABASE_URL, // ✅ From environment
} as const;
```

## Environment Variable Validation

The application now includes **automatic validation** that prevents the use of weak or default credentials:

### Validated Patterns

- Passwords matching `/test/` (exact match)
- Common weak patterns: `/password/i`, `/123456/`, `/admin/i`, `/secret/i`
- Default secret values are rejected in production

### Example Validation Errors

```
ERROR: Environment validation failed: PostgreSQL password contains weak pattern: test
ERROR: Using default JWT secret in production
WARNING: Using test database name in development environment
```

## Required Secure Configuration

### 1. Database Credentials (.env)

```bash
# Minimum Requirements
POSTGRES_DB=jasaweb                    # ✅ Descriptive name
POSTGRES_USER=jasaweb_admin            # ✅ Not "test" or "admin"
POSTGRES_PASSWORD=JwS3cur3P@ss!2024    # ✅ Strong, >32 chars
DATABASE_URL=postgresql://jasaweb_admin:JwS3cur3P@ss!2024@localhost:5432/jasaweb
```

### 2. JWT & Encryption Secrets

```bash
JWT_SECRET=Kj7#mP9@xL2$nQ5!rT8&wE1*vB3^yZ6%  # ✅ 32+ chars, alphanumeric + symbols
JWT_REFRESH_SECRET=Np4@mQ8#xL1$tR6!wU9&vE2^yC3^zX7%
SESSION_SECRET=Hj6#nO8@mP3$qS7!rV0&tB4*wX2^yZ5%
ENCRYPTION_KEY=Lm9@pQ6#xL4$tS2!wU8&vE5^yC3^zX0%
```

### 3. Storage Credentials

```bash
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE     # ✅ Actual AWS key format
S3_SECRET_KEY=JwS3cur3St0r4g3K3y2024!   # ✅ Strong password
MINIO_ROOT_USER=jasaweb_storage        # ✅ Descriptive, not default
MINIO_ROOT_PASSWORD=JwM1ni0P@ss!2024   # ✅ Strong, >32 chars
```

## Security Checklist

### ✅ Production Deployment

- [ ] No default secrets (change-me-in-production, etc.)
- [ ] Passwords > 32 characters with complexity requirements
- [ ] No "test", "admin", or "password" in credentials
- [ ] CORS origin not wildcard (`*`)
- [ ] SMTP secure connection enabled
- [ ] All required environment variables set

### ✅ Development Environment

- [ ] Still use strong credentials (prevents bad habits)
- [ ] Database name not "test" (warning issued)
- [ ] Validation warnings reviewed and addressed

### ✅ CI/CD Pipeline

- [ ] Environment validation runs automatically
- [ ] Fails fast on security validation errors
- [ ] No hardcoded secrets in code or Docker images

## Generating Secure Secrets

Use the built-in utility function or cryptographically secure methods:

### Using the Built-in Generator

```typescript
import { generateSecureSecret } from '@jasaweb/config/env-validation';

const jwtSecret = generateSecureSecret(32); // Results in: Kj7#mP9@xL2$nQ5!rT8&wE1*vB3^yZ6%
```

### Using OpenSSL (CLI)

```bash
# Generate 32-character secure random string
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# Generate hexadecimal key
openssl rand -hex 32
```

### Using Node.js Crypto

```javascript
const crypto = require('crypto');
const secret = crypto
  .randomBytes(32)
  .toString('base64')
  .replace(/[^a-zA-Z0-9+/=_-]/g, '')
  .substring(0, 32);
```

## Monitoring and Alerts

The application will automatically:

1. **Log warnings** for weak patterns in development
2. **Fail startup** for required variables in production
3. **Alert** on use of default secrets in production
4. **Validate** key formats and minimum lengths

Check logs regularly for security warnings:

```bash
# Check for validation messages
npm run dev | grep -E "(WARN|ERROR).*(password|secret|credential)"
```

## Compromise Response

If you suspect credential exposure:

1. **Immediately rotate** all environment variables
2. **Audit** access logs for unusual activity
3. **Review** git history for accidental commits
4. **Update** any stored encrypted data
5. **Force** password resets for all users
6. **Notify** stakeholders of data breach

## Additional Security Measures

### Environment Specific Security

- **Development**: Warnings for test credentials
- **Production**: Strict validation, fails fast
- **Testing**: Allows test fixtures but validates patterns

### Runtime Security

- Helmet security headers
- Rate limiting on auth endpoints
- Multi-tenant isolation
- Input validation and sanitization
- Comprehensive error handling (no information leakage)

### Infrastructure Security

- Encrypted connections at all layers
- Secure secret management (HashiCorp Vault, AWS Secrets Manager)
- Regular security audits and penetration testing
- Automated dependency vulnerability scanning

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential for maintaining a secure web development service platform.
