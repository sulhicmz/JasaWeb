# Dynamic URL Configuration

This document explains the new dynamic URL configuration system that eliminates hardcoded production URLs and improves multi-tenant deployment capabilities.

## Overview

The JasaWeb platform now uses a centralized URL configuration system that:

- Eliminates hardcoded production URLs throughout the codebase
- Supports environment-specific URL configuration
- Enables multi-tenant deployments with different domains
- Provides automatic CORS origin management
- Includes comprehensive validation and testing

## Environment Variables

### Production URLs

- `PRODUCTION_API_URL`: Production API URL (default: `https://api.jasaweb.com`)
- `PRODUCTION_WEB_URL`: Production web URL (default: `https://jasaweb.com`)
- `PRODUCTION_CDN_URL`: Production CDN URL (default: `https://cdn.jasaweb.com`)

### Staging URLs

- `STAGING_API_URL`: Staging API URL (default: `https://api-staging.jasaweb.com`)
- `STAGING_WEB_URL`: Staging web URL (default: `https://staging.jasaweb.com`)
- `STAGING_CDN_URL`: Staging CDN URL (default: `https://cdn-staging.jasaweb.com`)

### Development URLs

- `DEV_API_PORT`: Development API port (default: `3000`)
- `DEV_WEB_PORT`: Development web port (default: `4321`)
- `DEV_API_HOST`: Development API host (default: `localhost`)
- `DEV_WEB_HOST`: Development web host (default: `localhost`)

### Test URLs

- `TEST_API_URL`: Test environment API URL (default: `http://localhost:3001`)
- `TEST_WEB_URL`: Test environment web URL (default: `http://localhost:4322`)

### CORS Configuration

- `ADDITIONAL_CORS_ORIGINS`: Comma-separated list of additional CORS origins
- `INCLUDE_STAGING_ORIGINS`: Include staging origins in non-staging environments (`true`/`false`)
- `INCLUDE_PRODUCTION_ORIGINS`: Include production origins in non-production environments (`true`/`false`)

## Usage Examples

### Basic Usage

```typescript
import { getApiUrl, getWebUrl, getAllowedOrigins } from '@jasaweb/config';

// Get current environment URLs
const apiUrl = getApiUrl();
const webUrl = getWebUrl();

// Get allowed CORS origins
const corsOrigins = getAllowedOrigins();
```

### Environment-Specific Behavior

```typescript
// Development (NODE_ENV=development)
console.log(getApiUrl()); // http://localhost:3000
console.log(getWebUrl()); // http://localhost:4321

// Production (NODE_ENV=production)
console.log(getApiUrl()); // https://api.jasaweb.com
console.log(getWebUrl()); // https://jasaweb.com

// Staging (NODE_ENV=staging)
console.log(getApiUrl()); // https://api-staging.jasaweb.com
console.log(getWebUrl()); // https://staging.jasaweb.com
```

### Custom Configuration

```bash
# Custom production domain
export PRODUCTION_API_URL="https://api.mycompany.com"
export PRODUCTION_WEB_URL="https://mycompany.com"

# Custom development setup
export DEV_API_HOST="192.168.1.100"
export DEV_API_PORT="3001"
export DEV_WEB_HOST="192.168.1.100"
export DEV_WEB_PORT="4323"

# Additional CORS origins
export ADDITIONAL_CORS_ORIGINS="https://app.mycompany.com,https://admin.mycompany.com"
```

## Multi-Tenant Deployment

### Subdomain-based Multi-tenancy

```bash
# Tenant A
export PRODUCTION_API_URL="https://api.tenant_a.jasaweb.com"
export PRODUCTION_WEB_URL="https://tenant_a.jasaweb.com"

# Tenant B
export PRODUCTION_API_URL="https://api.tenant_b.jasaweb.com"
export PRODUCTION_WEB_URL="https://tenant_b.jasaweb.com"
```

### Custom Domain Multi-tenancy

```bash
# Custom domain deployment
export PRODUCTION_API_URL="https://api.client-website.com"
export PRODUCTION_WEB_URL="https://client-website.com"
```

## Configuration Validation

The system includes built-in validation:

```typescript
import { urlConfig } from '@jasaweb/config';

const validation = urlConfig.validateConfig();

if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

### Validation Rules

1. **Required URLs**: API and Web URLs must be configured
2. **HTTPS in Production**: Production URLs must use HTTPS
3. **URL Format**: Valid URL format is required

## Migration Guide

### Before (Hardcoded URLs)

```typescript
// Old way - hardcoded
const apiUrl = 'https://api.jasaweb.com';
const webUrl = 'https://jasaweb.com';
const corsOrigins = ['https://jasaweb.com', 'https://api.jasaweb.com'];
```

### After (Dynamic Configuration)

```typescript
// New way - dynamic
import { getApiUrl, getWebUrl, getAllowedOrigins } from '@jasaweb/config';

const apiUrl = getApiUrl();
const webUrl = getWebUrl();
const corsOrigins = getAllowedOrigins();
```

## Docker Configuration

```dockerfile
# Dockerfile
ENV PRODUCTION_API_URL="https://api.mycompany.com"
ENV PRODUCTION_WEB_URL="https://mycompany.com"
ENV PRODUCTION_CDN_URL="https://cdn.mycompany.com"
```

```yaml
# docker-compose.yml
services:
  api:
    environment:
      - PRODUCTION_API_URL=https://api.mycompany.com
      - PRODUCTION_WEB_URL=https://mycompany.com
      - ADDITIONAL_CORS_ORIGINS=https://admin.mycompany.com
```

## Environment Examples

### Local Development

```bash
# .env.development
NODE_ENV=development
DEV_API_PORT=3000
DEV_WEB_PORT=4321
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
STAGING_API_URL=https://api-staging.mycompany.com
STAGING_WEB_URL=https://staging.mycompany.com
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
PRODUCTION_API_URL=https://api.mycompany.com
PRODUCTION_WEB_URL=https://mycompany.com
PRODUCTION_CDN_URL=https://cdn.mycompany.com
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure all required origins are in `getAllowedOrigins()`
2. **SSL/HTTPS Issues**: Production URLs must use HTTPS
3. **WebSocket Connections**: WebSocket URLs are automatically derived from API URLs

### Debug Configuration

```typescript
import { urlConfig } from '@jasaweb/config';

// Debug configuration
console.log('All config:', urlConfig.getAllConfig());
console.log('Validation:', urlConfig.validateConfig());
```

## Testing

Run the URL configuration tests:

```bash
npm run test packages/config/url-config.test.ts
```

The test suite covers:

- Environment-specific URL resolution
- CORS origin generation
- Configuration validation
- Custom hostname and port configuration
- SSL validation for production

## Security Considerations

1. **HTTPS Enforcement**: Production URLs are validated to use HTTPS
2. **Origin Filtering**: CORS origins are explicitly configured
3. **Configuration Validation**: Invalid configurations are rejected
4. **No Hardcoded Secrets**: All configuration is environment-based

## Future Enhancements

- Support for load balancer configurations
- Automatic SSL certificate management
- Dynamic DNS configuration
- Health check URL configuration
- Service discovery integration
