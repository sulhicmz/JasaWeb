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

- **JWT Secrets**: Minimum 32 characters, no common patterns
- **Session Secret**: Minimum 32 characters, high entropy
- **Encryption Key**: Exactly 32 characters (AES-256 requirement)

## ⚠️ Security Notes

1. **Never commit secrets to version control**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly in production**
4. **Store secrets securely (AWS Secrets Manager, Azure Key Vault, etc.)**
5. **Application will fail to start without required secrets**

## 🚀 Quick Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Generate and update the required secrets in your `.env` file

3. Start the application:
   ```bash
   pnpm dev
   ```

The application will validate all security secrets on startup and fail with clear error messages if any are missing or invalid.
