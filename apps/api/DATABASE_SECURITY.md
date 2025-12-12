# Database Security Configuration Guide

## Overview

This document provides secure configuration guidelines for the JasaWeb database setup, ensuring proper security practices are followed.

## Security Requirements

### 1. Environment Variables

All database credentials must be configured using environment variables. **Never hardcode credentials in source code or build scripts.**

#### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://username:strong_password@host:5432/database_name?sslmode=require

# For production environments, ensure SSL is enabled
# Example: postgresql://user:password@db.example.com:5432/jasaweb?sslmode=require
```

### 2. Password Security

#### Password Requirements

- Minimum 16 characters
- Include uppercase and lowercase letters
- Include numbers and special characters
- Avoid dictionary words or common patterns
- Use unique passwords for each environment

#### Generating Secure Passwords

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using pwgen
pwgen -s 16 1

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(24))"
```

### 3. Connection Security

#### Production Requirements

- **SSL/TLS Required**: Always use `sslmode=require` in production
- **No Localhost**: Production databases should not use localhost
- **Connection Pooling**: Configure appropriate pool sizes
- **Network Security**: Use VPCs, firewalls, and allowlists

#### Development Environment

```bash
# Development (can use localhost)
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/jasaweb_dev

# Test Environment
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/jasaweb_test
```

#### Production Environment

```bash
# Production (with SSL and remote host)
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@db.example.com:5432/jasaweb_prod?sslmode=require&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem
```

### 4. Database Validation

The application includes automatic database security validation that checks for:

- Weak or default passwords
- Missing SSL in production
- Invalid database URL formats
- Connection health monitoring

#### Health Check Endpoints

```bash
# General health check
GET /health

# Database-specific health check
GET /health/database

# HTTP connectivity check
GET /health/http
```

### 5. Environment-Specific Configuration

#### Development (.env.development)

```bash
NODE_ENV=development
DATABASE_URL=postgresql://dev_user:secure_dev_password@localhost:5432/jasaweb_dev
LOG_LEVEL=debug
```

#### Testing (.env.test)

```bash
NODE_ENV=test
DATABASE_URL=postgresql://test_user:secure_test_password@localhost:5432/jasaweb_test
LOG_LEVEL=error
```

#### Production (.env.production)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:VERY_STRONG_PASSWORD@db.example.com:5432/jasaweb_prod?sslmode=require
LOG_LEVEL=info
```

### 6. Security Best Practices

#### Access Control

- Use database users with minimal required permissions
- Implement read-only users for reporting
- Regularly rotate database passwords
- Use connection timeouts and idle limits

#### Monitoring and Auditing

- Enable database query logging
- Monitor connection attempts
- Set up alerts for suspicious activity
- Regular security audits

#### Backup Security

- Encrypt database backups
- Store backups securely (different location)
- Test backup restoration regularly
- Implement retention policies

### 7. Migration and Deployment

#### Safe Migration Process

1. Backup database before migration
2. Test migrations in staging environment
3. Use transactional migrations when possible
4. Have rollback plans ready

#### Configuration Management

```bash
# Validate configuration before starting
npm run build

# Check database health
curl http://localhost:3000/health/database

# Test with environment validation
npm run test:security
```

## Troubleshooting

### Common Issues

#### Connection Failed

```bash
# Check database URL format
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL

# Check health endpoint
curl http://localhost:3000/health/database
```

#### SSL Errors

```bash
# Verify SSL certificate
openssl s_client -connect db.example.com:5432 -starttls postgres

# Test with SSL mode
psql "postgresql://user:pass@host:5432/db?sslmode=require"
```

#### Password Issues

```bash
# Update database user password
ALTER USER prod_user PASSWORD 'new_strong_password';

# Test new connection
psql "postgresql://prod_user:new_strong_password@host:5432/db"
```

## Security Checklist

- [ ] No hardcoded credentials in source code
- [ ] Strong passwords (16+ characters, complex)
- [ ] SSL enabled in production
- [ ] Environment-specific configurations
- [ ] Database user permissions minimized
- [ ] Connection pooling configured
- [ ] Health monitoring enabled
- [ ] Backup encryption implemented
- [ ] Regular password rotation
- [ ] Security audits scheduled

## Support

For security-related issues or questions:

1. Check the health endpoints first
2. Review the application logs
3. Consult the security team
4. Follow the incident response plan

---

**Remember**: Security is an ongoing process. Regular reviews and updates are essential to maintain a secure database configuration.
