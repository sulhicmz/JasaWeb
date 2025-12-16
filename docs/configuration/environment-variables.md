# Environment Variables Configuration

This document outlines all the environment variables that can be configured for the JasaWeb application.

## Web Application (apps/web)

### API Configuration

- `PUBLIC_API_BASE_URL`: Base URL for API calls (default: http://localhost:3001)
- `PUBLIC_WEB_URL`: Base URL for the web application (default: http://localhost:4321)
- `PUBLIC_SITE_URL`: Production site URL (default: https://jasaweb.id)
- `PUBLIC_REQUEST_TIMEOUT`: Request timeout in milliseconds (default: 30000)
- `PUBLIC_RETRY_DELAY`: Retry delay in milliseconds (default: 1000)
- `PUBLIC_MAX_RETRIES`: Maximum number of retries (default: 3)

### Cache Configuration

- `PUBLIC_ANALYTICS_CACHE_TTL`: Analytics cache TTL in seconds (default: 300)
- `PUBLIC_DASHBOARD_CACHE_TTL`: Dashboard cache TTL in seconds (default: 60)
- `PUBLIC_KNOWLEDGE_BASE_CACHE_TTL`: Knowledge base cache TTL in seconds (default: 600)

### Business Configuration

- `PUBLIC_CURRENCY_SYMBOL`: Currency symbol (default: Rp)
- `PUBLIC_CURRENCY_LOCALE`: Currency locale (default: id-ID)
- `PUBLIC_SLA_HIGH`: SLA for high priority tickets in hours (default: 24)
- `PUBLIC_SLA_MEDIUM`: SLA for medium priority tickets in hours (default: 48)
- `PUBLIC_SLA_LOW`: SLA for low priority tickets in hours (default: 72)
- `PUBLIC_SLA_CRITICAL`: SLA for critical priority tickets in hours (default: 4)

### Business Limits

- `PUBLIC_MAX_FILE_SIZE`: Maximum file size in bytes (default: 10485760 = 10MB)
- `PUBLIC_MAX_FILES_PER_UPLOAD`: Maximum files per upload (default: 5)
- `PUBLIC_PAGINATION_LIMIT`: Default pagination limit (default: 10)
- `PUBLIC_SEARCH_RESULTS_LIMIT`: Maximum search results (default: 20)

### Contact Information

- `PUBLIC_CONTACT_EMAIL`: Contact email address (default: info@jasaweb.com)
- `PUBLIC_CONTACT_PHONE`: Contact phone number (default: +62-21-1234-5678)
- `PUBLIC_CONTACT_ADDRESS`: Contact address (default: Jakarta, Indonesia)

### Notification Configuration

- `PUBLIC_DESKTOP_NOTIFICATIONS`: Enable desktop notifications (default: true)
- `PUBLIC_NOTIFICATION_ICON`: Notification icon path (default: /favicon.ico)
- `PUBLIC_NOTIFICATION_SOUND`: Enable notification sound (default: true)
- `PUBLIC_QUIET_HOURS`: Enable quiet hours (default: true)
- `PUBLIC_QUIET_HOURS_START`: Quiet hours start time (default: 22:00)
- `PUBLIC_QUIET_HOURS_END`: Quiet hours end time (default: 08:00)
- `PUBLIC_MAX_VISIBLE_NOTIFICATIONS`: Maximum visible notifications (default: 5)
- `PUBLIC_AUTO_HIDE_DELAY`: Auto-hide delay in milliseconds (default: 5000)
- `PUBLIC_URGENT_AUTO_HIDE_DELAY`: Urgent auto-hide delay in milliseconds (default: 10000)
- `PUBLIC_FROM_EMAIL`: From email address (default: noreply@jasaweb.dev)
- `PUBLIC_SUPPORT_EMAIL`: Support email address (default: support@jasaweb.dev)
- `PUBLIC_DIGEST_FREQUENCY`: Email digest frequency (default: weekly)

### Analytics Configuration

- `PUBLIC_ANALYTICS_PERIOD`: Default analytics period in days (default: 30)
- `PUBLIC_PERFORMANCE_PERIOD`: Default performance period in days (default: 90)

## API Application (apps/api)

### Server Configuration

- `PORT`: API server port (default: 3000)
- `HOST`: API server host (default: 0.0.0.0)
- `FRONTEND_URL`: Frontend URL (default: https://jasaweb.com)
- `API_URL`: API URL (default: https://api.jasaweb.com)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins

### Database Configuration

- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_USER`: Database username (default: postgres)
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (default: jasaweb)
- `DB_POOL_MIN`: Minimum pool connections (default: 2)
- `DB_POOL_MAX`: Maximum pool connections (default: 10)
- `DB_IDLE_TIMEOUT`: Idle timeout in milliseconds (default: 30000)
- `DB_CONNECTION_TIMEOUT`: Connection timeout in milliseconds (default: 2000)

### Storage Configuration

- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 10485760)
- `MAX_FILES_PER_REQUEST`: Maximum files per request (default: 5)
- `AWS_REGION`: AWS S3 region (default: us-east-1)
- `S3_BUCKET`: S3 bucket name (default: jasaweb-files)
- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `S3_ENDPOINT`: S3-compatible endpoint (optional)
- `S3_FORCE_PATH_STYLE`: Force S3 path style (default: false)
- `SIGNED_URL_EXPIRY`: Signed URL expiry in seconds (default: 3600)

### Cache Configuration

- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password
- `REDIS_DB`: Redis database number (default: 0)
- `REDIS_KEY_PREFIX`: Redis key prefix (default: jasaweb:)
- `CACHE_DEFAULT_TTL`: Default cache TTL in seconds (default: 300)
- `CACHE_DASHBOARD_TTL`: Dashboard cache TTL in seconds (default: 60)
- `CACHE_PROJECT_TTL`: Project cache TTL in seconds (default: 180)
- `CACHE_ANALYTICS_TTL`: Analytics cache TTL in seconds (default: 600)
- `CACHE_SESSION_TTL`: Session cache TTL in seconds (default: 86400)

### Security Configuration

- `JWT_SECRET`: JWT secret key
- `JWT_ACCESS_EXPIRES_IN`: JWT access token expiry (default: 15m)
- `JWT_REFRESH_EXPIRES_IN`: JWT refresh token expiry (default: 7d)
- `JWT_ISSUER`: JWT issuer (default: jasaweb-api)
- `JWT_AUDIENCE`: JWT audience (default: jasaweb-client)
- `BCRYPT_ROUNDS`: Bcrypt rounds (default: 12)
- `PASSWORD_MIN_LENGTH`: Minimum password length (default: 8)
- `PASSWORD_REQUIRE_UPPERCASE`: Require uppercase letters (default: true)
- `PASSWORD_REQUIRE_LOWERCASE`: Require lowercase letters (default: true)
- `PASSWORD_REQUIRE_NUMBERS`: Require numbers (default: true)
- `PASSWORD_REQUIRE_SPECIAL`: Require special characters (default: true)

### Rate Limiting

- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)
- `RATE_LIMIT_MAX_AUTH_REQUESTS`: Maximum auth requests per window (default: 10)
- `RATE_LIMIT_SUCCESS_REQUESTS`: Successful requests limit (default: 5)

### Authentication Security

- `MAX_LOGIN_ATTEMPTS`: Maximum login attempts (default: 5)
- `LOCKOUT_DURATION_MS`: Lockout duration in milliseconds (default: 900000)
- `TWO_FACTOR_ENABLED`: Enable two-factor authentication (default: false)
- `MAGIC_LINK_EXPIRY`: Magic link expiry in seconds (default: 3600)

### Content Security Policy

- `CSP_ENABLED`: Enable CSP (default: true)

### Email Configuration

- `EMAIL_PROVIDER`: Email provider (default: resend)
- `SMTP_HOST`: SMTP host (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_SECURE`: Use secure SMTP (default: false)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `FROM_EMAIL`: From email address
- `FROM_NAME`: From name
- `REPLY_TO_EMAIL`: Reply-to email
- `REPLY_TO_NAME`: Reply-to name
- `SUPPORT_EMAIL`: Support email
- `QUEUE_ENABLED`: Enable email queue (default: true)
- `EMAIL_MAX_RETRIES`: Maximum email retries (default: 3)
- `EMAIL_RETRY_DELAY`: Email retry delay in milliseconds (default: 5000)

### Business Configuration

- `MAX_PROJECTS_PER_ORG`: Maximum projects per organization (default: 50)
- `MAX_MILESTONES_PER_PROJECT`: Maximum milestones per project (default: 20)
- `MAX_FILES_PER_PROJECT`: Maximum files per project (default: 100)

### SLA Configuration

- `SLA_CRITICAL_RESPONSE`: Critical response time in hours (default: 4)
- `SLA_HIGH_RESPONSE`: High response time in hours (default: 24)
- `SLA_MEDIUM_RESPONSE`: Medium response time in hours (default: 48)
- `SLA_LOW_RESPONSE`: Low response time in hours (default: 72)
- `SLA_CRITICAL_RESOLUTION`: Critical resolution time in hours (default: 72)
- `SLA_HIGH_RESOLUTION`: High resolution time in hours (default: 168)
- `SLA_MEDIUM_RESOLUTION`: Medium resolution time in hours (default: 336)
- `SLA_LOW_RESOLUTION`: Low resolution time in hours (default: 720)

### Analytics Configuration

- `ANALYTICS_DEFAULT_PERIOD`: Default analytics period in milliseconds (default: 2592000000 = 30 days)
- `ANALYTICS_MAX_RETENTION`: Maximum data retention in days (default: 365)
- `ANALYTICS_BATCH_INTERVAL`: Analytics batch interval in milliseconds (default: 300000 = 5 minutes)

### Risk Assessment Configuration

- `RISK_HIGH_OVERDUE_MILESTONES`: High risk overdue milestones (default: 5)
- `RISK_HIGH_PROJECTS`: High risk projects (default: 2)
- `RISK_HIGH_CRITICAL_TICKETS`: High risk critical tickets (default: 3)
- `RISK_BUDGET_OVERRUN_THRESHOLD`: Budget overrun threshold (default: 0.2 = 20%)
- `RISK_MEDIUM_OVERDUE_MILESTONES`: Medium risk overdue milestones (default: 2)
- `RISK_MEDIUM_PROJECTS`: Medium risk projects (default: 0)
- `RISK_MEDIUM_CRITICAL_TICKETS`: Medium risk critical tickets (default: 1)
- `RISK_LOW_OVERDUE_MILESTONES`: Low risk overdue milestones (default: 0)
- `RISK_LOW_PROJECTS`: Low risk projects (default: 0)
- `RISK_LOW_CRITICAL_TICKETS`: Low risk critical tickets (default: 0)

### Team Capacity Configuration

- `HOURS_PER_PROJECT_PER_WEEK`: Hours per project per week (default: 40)
- `HOURS_PER_TEAM_MEMBER_PER_WEEK`: Hours per team member per week (default: 35)
- `UTILIZATION_TARGET`: Utilization target (default: 0.8 = 80%)
- `CAPACITY_BUFFER`: Capacity buffer (default: 0.2 = 20%)

### Monitoring Configuration

- `HEALTH_CHECK_INTERVAL`: Health check interval in milliseconds (default: 30000)
- `HEALTH_CHECK_TIMEOUT`: Health check timeout in milliseconds (default: 5000)
- `METRICS_ENABLED`: Enable metrics (default: true)
- `METRICS_PREFIX`: Metrics prefix (default: jasaweb\_)
- `METRICS_COLLECTION_INTERVAL`: Metrics collection interval in milliseconds (default: 60000)

### Logging Configuration

- `LOG_LEVEL`: Log level (default: info)
- `LOG_FORMAT`: Log format (default: json)
- `AUDIT_LOG_ENABLED`: Enable audit logging (default: true)
- `AUDIT_LOG_RETENTION_DAYS`: Audit log retention in days (default: 90)
