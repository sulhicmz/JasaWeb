# Environment Variable Security Requirements

## Overview

This document outlines the security requirements for environment variables in the JasaWeb platform. All environment variables must be properly configured to ensure the security and stability of the application.

## Critical Security Changes

### 1. Removed Default Credentials

**Previous Behavior**: Docker Compose used hardcoded default passwords as fallbacks

```bash
# INSECURE - DO NOT USE
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
REDIS_PASSWORD: ${REDIS_PASSWORD:-redis_password}
MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin123}
```

**Current Behavior**: All credentials must be explicitly provided

```bash
# SECURE - Required environment variables
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
REDIS_PASSWORD: ${REDIS_PASSWORD}
MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
```

### 2. Environment Variable Validation

The application now includes comprehensive validation that:

- Validates required environment variables on startup
- Enforces minimum password lengths (16+ characters)
- Validates secret key formats and strength
- Provides security warnings for weak patterns in production
- Fails fast if critical variables are missing

## Required Environment Variables

### Database Configuration

```bash
POSTGRES_DB=jasaweb                    # Database name
POSTGRES_USER=postgres                  # Database username
POSTGRES_PASSWORD=secure_password_32+   # Minimum 16 characters
```

### Redis Configuration

```bash
REDIS_PASSWORD=secure_redis_password_32+  # Minimum 16 characters
```

### MinIO Configuration

```bash
MINIO_ROOT_USER=minioadmin              # Minimum 3 characters
MINIO_ROOT_PASSWORD=secure_minio_password_32+  # Minimum 16 characters
```

### Security Configuration

```bash
JWT_SECRET=secure_jwt_secret_32_chars_alphanumeric  # Minimum 32, alphanumeric + symbols
JWT_REFRESH_SECRET=secure_refresh_secret_32_chars   # Minimum 32, alphanumeric + symbols
SESSION_SECRET=secure_session_secret_32_chars       # Minimum 32, alphanumeric + symbols
ENCRYPTION_KEY=secure_encryption_key_32_chars       # Minimum 32, alphanumeric + symbols
```

## Security Requirements

### Password Strength

- **Minimum Length**: 16 characters for all passwords
- **Recommended Length**: 32+ characters for production
- **Character Requirements**: Use alphanumeric characters plus symbols
- **Avoid**: Common patterns like "password", "admin", "123456"

### Secret Key Requirements

- **Minimum Length**: 32 characters
- **Allowed Characters**: A-Z, a-z, 0-9, +, /, =, \_, -
- **No Default Values**: Never use example secrets in production

### Production Security Checks

The validation system will warn about:

- Weak password patterns
- Default/example secrets
- Missing required variables
- Invalid character patterns

## Setup Instructions

### 1. Generate Secure Secrets

Use the provided utility function or a secure method to generate secrets:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using OpenSSL
openssl rand -base64 32
```

### 2. Create Environment File

Copy the example and update with secure values:

```bash
cp .env.example .env
# Edit .env with your secure values
```

### 3. Docker Compose Setup

Create a `.env` file in the project root with all required variables:

```bash
# Required for Docker Compose
POSTGRES_DB=jasaweb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_postgres_password_32_chars
REDIS_PASSWORD=your_secure_redis_password_32_chars
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_secure_minio_password_32_chars

# Application secrets
JWT_SECRET=your_secure_jwt_secret_32_chars_alphanumeric
JWT_REFRESH_SECRET=your_secure_refresh_secret_32_chars_alphanumeric
SESSION_SECRET=your_secure_session_secret_32_chars_alphanumeric
ENCRYPTION_KEY=your_secure_encryption_key_32_chars_alphanumeric
```

### 4. Start the Application

```bash
# With Docker Compose
docker-compose up -d

# Or locally
pnpm dev
```

The application will validate all environment variables on startup and fail if requirements are not met.

## Validation Features

### Automatic Validation

- Runs on application startup
- Validates all required variables
- Checks password strength and format
- Provides clear error messages

### Security Warnings

- Detects weak password patterns in production
- Warns about default/example values
- Provides recommendations for improvement

### Error Handling

- Fails fast on missing critical variables
- Provides specific error messages
- Includes guidance for fixing issues

## Best Practices

### Development

- Use strong, unique passwords even in development
- Never commit real secrets to version control
- Use `.env.example` as a template only

### Production

- Use environment-specific secret management
- Rotate secrets regularly
- Monitor for security warnings
- Use different secrets for different environments

### Security

- Store secrets securely (AWS Secrets Manager, Azure Key Vault, etc.)
- Limit access to production secrets
- Audit secret access and usage
- Use least privilege principle

## Troubleshooting

### Common Issues

1. **"Required environment variable X is missing"**
   - Add the missing variable to your `.env` file
   - Ensure the variable is not empty

2. **"Environment variable X must be at least N characters"**
   - Increase the length of the password/secret
   - Use a secure password generator

3. **"Environment variable X contains invalid characters"**
   - Use only allowed characters for secrets (alphanumeric + symbols)
   - Avoid special characters that may cause issues

### Getting Help

- Check the validation error messages for specific guidance
- Refer to `.env.example` for the complete list of required variables
- Review the security requirements above
- Contact the development team for assistance

## Migration Guide

If upgrading from a previous version with default credentials:

1. **Backup your data** before making changes
2. **Generate new secure passwords** for all services
3. **Update your `.env` file** with the new values
4. **Restart services** to apply new credentials
5. **Verify all services** are working correctly

The validation system will help identify any missing or insecure configurations during the migration process.
