# Configuration Management Guide

## Overview

JasaWeb uses a centralized configuration management system to eliminate hardcoded values and improve maintainability, scalability, and deployment flexibility. This guide covers the configuration structure, validation, and best practices.

## Architecture

### Web App Configuration (`apps/web/src/config/`)

The web application configuration is organized into logical modules:

- **`apiConfig`**: API endpoints, timeouts, and cache settings
- **`uiConfig`**: Theme colors, chart colors, button variants, and loading states
- **`businessConfig`**: Currency, project statuses, ticket priorities, and business rules
- **`notificationConfig`**: Desktop notifications, quiet hours, and in-app alerts
- **`featureFlags`**: Feature toggles for enabling/disabling functionality
- **`environment`**: Environment detection and debug settings
- **`routes`**: Application routing paths

### API Configuration (`apps/api/src/config/`)

The API configuration includes comprehensive settings for:

- **`apiConfig`**: Server settings, URLs, and CORS configuration
- **`databaseConfig`**: Database connection and pool settings
- **`storageConfig`**: File upload limits, MIME types, and S3/local storage
- **`cacheConfig`**: Redis configuration and TTL values
- **`securityConfig`**: JWT, password policies, rate limiting, and CSP
- **`emailConfig`**: Email provider settings, templates, and queue configuration
- **`businessConfig`**: Currency, project limits, SLA settings, and risk thresholds
- **`monitoringConfig`**: Health checks, metrics, logging, and error tracking

## Validation

Both web and API configurations include built-in validation:

### Web App Validation

- Validates API URLs and timeout values
- Ensures required business configuration values are present
- Logs errors in development mode

### API Validation

- Validates all critical configuration values
- Enforces security requirements in production
- Provides detailed error messages and severity levels
- Prevents server startup with critical configuration errors

## Environment Variables

### Web App Environment Variables

```bash
# Required
PUBLIC_API_BASE_URL=http://localhost:3001

# Feature Flags
PUBLIC_FEATURE_REAL_TIME_UPDATES=true
PUBLIC_FEATURE_ADVANCED_CHARTS=true
PUBLIC_FEATURE_EMAIL_NOTIFICATIONS=true

# UI Customization
PUBLIC_UI_PRIMARY_COLOR=#3B82F6
PUBLIC_CURRENCY_SYMBOL=Rp
```

### API Environment Variables

The API supports extensive configuration through environment variables. See `apps/api/.env.template` for complete list.

## Usage Examples

### Web App Usage

```typescript
import { config } from '../config';

// API calls
const response = await fetch(
  `${config.api.baseUrl}${config.api.analyticsEndpoint}`,
  {
    signal: AbortSignal.timeout(config.api.requestTimeout),
  }
);

// UI theming
const primaryColor = config.ui.colors.primary.main;
const chartColors = config.ui.charts.projects.colors;

// Feature flags
if (config.features.realTimeUpdates) {
  enableWebSocket();
}
```

### API Usage

```typescript
import { config } from '../config';

// Database configuration
const sequelize = new Sequelize({
  host: config.database.host,
  port: config.database.port,
  // ... other config values
});

// Security settings
const hash = await bcrypt.hash(password, config.security.password.bcryptRounds);

// Business logic
if (overdueMilestones > config.business.risk.highRisk.overdueMilestones) {
  escalateRisk();
}
```

## Configuration Hierarchy

Configuration values are resolved in the following order:

1. **Environment Variables** (highest priority)
2. **Default Values** in configuration files
3. **Fallback Values** for optional settings

## Security Considerations

### Production Environment

- Configuration validation enforces secure defaults
- Prevents startup with weak secrets in production
- Validates CORS origins and CSP settings

### Secret Management

- Sensitive values (JWT secrets, API keys) should use environment variables
- Never commit real secrets to version control
- Use secret management services in production

## Migration Guide

### Migrating from Hardcoded Values

1. **Identify hardcoded values** using the catalog in `todo.md`
2. **Add configuration entry** to appropriate config module
3. **Update imports** to use centralized configuration
4. **Add environment variables** if the value should be configurable
5. **Update tests** to use configuration values

### Example Migration

**Before:**

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

**After:**

```typescript
import { config } from '../config';
const MAX_FILE_SIZE = config.storage.maxFileSize;
```

## Best Practices

### Configuration Design

- Group related settings logically
- Provide sensible defaults
- Use TypeScript for type safety
- Add validation for critical values

### Environment Management

- Use descriptive variable names
- Provide template files for each environment
- Document required and optional variables
- Use environment-specific validation rules

### Feature Flags

- Use feature flags for new functionality
- Implement gradual rollouts
- Monitor flag usage and performance
- Document flag purpose and removal criteria

## Testing

### Unit Tests

- Mock configuration values for testing
- Test validation logic
- Verify default values
- Test environment-specific behavior

### Integration Tests

- Test with different environment configurations
- Validate configuration loading
- Test error handling for invalid configurations

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Check `.env.template` for required variables
   - Verify variable names match exactly
   - Ensure environment is correctly detected

2. **Configuration Validation Errors**
   - Review validation error messages
   - Check configuration type mismatches
   - Verify environment-specific requirements

3. **Runtime Configuration Errors**
   - Validate configuration at startup
   - Check for circular dependencies
   - Verify import paths

### Debug Mode

Enable debug mode to get detailed configuration information:

```bash
# Web App
DEBUG=true npm run dev:web

# API
DEBUG=true npm run dev:api
```

## Maintenance

### Regular Tasks

- Review configuration for unused values
- Update documentation for new settings
- Validate environment variables across environments
- Monitor configuration-related errors

### Configuration Drift

- Use configuration validation to detect drift
- Document configuration changes
- Use version control for template files
- Implement configuration audits

## Performance Considerations

### Configuration Loading

- Configuration is loaded once at startup
- Use lazy loading for expensive operations
- Cache computed values when appropriate

### Memory Usage

- Avoid storing large objects in configuration
- Use references for shared values
- Clean up temporary configuration data

## Future Enhancements

### Planned Improvements

- Configuration hot-reloading for development
- Remote configuration service integration
- Advanced configuration validation rules
- Configuration versioning and rollback
- Environment-specific configuration inheritance

### Extensibility

- Plugin system for custom configuration providers
- Dynamic configuration updates
- Configuration schema validation
- Configuration analytics and monitoring
