# Configuration Management

This document explains JasaWeb's centralized configuration management system and how to use it effectively.

## Overview

JasaWeb uses a centralized configuration system to eliminate hardcoded values and ensure consistent configuration across the entire monorepo. This approach improves maintainability, deployment stability, and developer experience.

## Configuration Services

### Web Configuration (`apps/web/src/config/webConfig.ts`)

Handles web application-specific settings including SEO, feature flags, and site configuration.

```typescript
import webConfig from '../config/webConfig';

// Get site configuration
const siteName = webConfig.siteName;
const apiUrl = webConfig.apiUrl;

// Check feature flags
if (webConfig.enableNotifications) {
  // Initialize notifications
}
```

### API Configuration (`apps/web/src/config/apiConfig.ts`)

Manages API client settings, endpoints, rate limiting, and WebSocket configuration.

```typescript
import { apiConfig } from '../config/apiConfig';

// Get API endpoints
const loginUrl = apiConfig.getEndpoint('auth', 'login');
const projectsUrl = apiConfig.getEndpoint('projects');

// Build authenticated requests
const headers = apiConfig.getAuthHeader(token);
```

### Service Ports (`packages/config/service-ports.ts`)

Centralizes port configuration for all services in the monorepo.

```typescript
import { servicePorts } from '@jasaweb/config/service-ports';

// Get service configuration
const apiPort = servicePorts.getPort('api');
const databaseUrl = servicePorts.getUrl('database');

// Generate Docker Compose configuration
const dockerServices = servicePorts.generateDockerComposeServices();
```

## Environment Variables

### Web Application (`apps/web`)

| Variable                   | Description              | Default                 | Required |
| -------------------------- | ------------------------ | ----------------------- | -------- |
| `SITE_URL`                 | Application base URL     | `http://localhost:4321` | No       |
| `SITE_NAME`                | Site name for SEO        | `JasaWeb`               | No       |
| `PUBLIC_API_URL`           | Public API URL           | `http://localhost:3000` | No       |
| `API_TIMEOUT`              | Request timeout (ms)     | `30000`                 | No       |
| `API_RETRIES`              | Number of retry attempts | `3`                     | No       |
| `ENABLE_REAL_TIME_UPDATES` | WebSocket feature flag   | `true`                  | No       |
| `ENABLE_ANALYTICS`         | Analytics feature flag   | `false`                 | No       |

### API Configuration

| Variable                 | Description                  | Default | Required |
| ------------------------ | ---------------------------- | ------- | -------- |
| `API_RATE_LIMIT_ENABLED` | Enable rate limiting         | `true`  | No       |
| `API_RATE_LIMIT_MAX`     | Max requests per window      | `100`   | No       |
| `WS_ENABLED`             | Enable WebSocket support     | `true`  | No       |
| `WS_RECONNECT_ATTEMPTS`  | WebSocket reconnect attempts | `5`     | No       |

### Service Ports

| Variable        | Description          | Default | Required |
| --------------- | -------------------- | ------- | -------- |
| `WEB_PORT`      | Web application port | `4321`  | No       |
| `API_PORT`      | API service port     | `3000`  | No       |
| `DATABASE_PORT` | PostgreSQL port      | `5432`  | No       |
| `REDIS_PORT`    | Redis port           | `6379`  | No       |

## Usage Examples

### Component Configuration

```typescript
// Before: Hardcoded values
const apiUrl = 'http://localhost:3000';
const timeout = 30000;

// After: Centralized configuration
import { apiConfig } from '../config/apiConfig';

const apiUrl = apiConfig.apiConfig.baseUrl;
const timeout = apiConfig.apiConfig.timeout;
```

### Environment-Specific Configuration

```typescript
// Development
VITE_SITE_URL=http://localhost:4321
VITE_PUBLIC_API_URL=http://localhost:3000

# Staging
VITE_SITE_URL=https://staging.jasaweb.com
VITE_PUBLIC_API_URL=https://api-staging.jasaweb.com

# Production
VITE_SITE_URL=https://jasaweb.com
VITE_PUBLIC_API_URL=https://api.jasaweb.com
```

### Docker Integration

```typescript
// Generate Docker Compose services with proper dependencies
const dockerConfig = servicePorts.generateDockerComposeServices();

/*
Output:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: jasaweb
  api:
    image: node:20-alpine
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
*/
```

## Configuration Validation

All configuration services include built-in validation:

```typescript
import { apiConfig } from '../config/apiConfig';

const validation = apiConfig.validateConfiguration();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
  // Handle configuration errors
}
```

## Security Considerations

1. **Never commit real secrets** to the repository
2. **Use environment-specific `.env` files** for each environment
3. **Validate configuration at startup** to fail fast on misconfiguration
4. **Provide sensible defaults** for development but require explicit values in production

## Migration Guide

### For Existing Components

1. Replace hardcoded values with configuration service imports
2. Update build scripts to include new environment variables
3. Add validation for required configuration

### Step-by-Step Migration

1. **Identify hardcoded values**

   ```bash
   # Search for hardcoded URLs and ports
   grep -r "localhost:3000" apps/web/src/
   grep -r "http://" apps/api/src/
   ```

2. **Replace with configuration**

   ```typescript
   // Before
   const response = await fetch('http://localhost:3000/api/projects');

   // After
   import { apiConfig } from '../config/apiConfig';
   const response = await fetch(apiConfig.buildUrl('/projects'));
   ```

3. **Update environment variables**
   ```bash
   # Add to .env.local
   PUBLIC_API_URL=http://localhost:3000
   API_TIMEOUT=30000
   ```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required variables are set in your `.env` file
   - Check that variable names match exactly (case-sensitive)

2. **Port Conflicts**
   - Use `servicePorts.validatePortConfiguration()` to detect conflicts
   - Check if other services are using the same ports

3. **Build Failures**
   - Verify all environment variables have valid values
   - Check configuration validation errors in build logs

### Debug Configuration

```typescript
// Debug configuration values
console.log('API Config Summary:', apiConfig.getConfigSummary());
console.log('Service Ports:', servicePorts.servicePorts);
console.log('Web Config:', webConfig);
```

## Best Practices

1. **Use TypeScript strict mode** for all configuration files
2. **Provide clear error messages** for configuration validation failures
3. **Document all environment variables** with examples
4. **Use feature flags** for optional functionality
5. **Separate development and production configurations**
6. **Validate configuration early** in the application lifecycle

## Future Enhancements

- Configuration hot-reloading in development
- Remote configuration management
- Configuration encryption for sensitive values
- Automatic environment detection
- Configuration templates for common setups
