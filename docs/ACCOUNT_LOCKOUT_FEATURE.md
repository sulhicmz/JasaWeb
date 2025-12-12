# Account Lockout Security Feature

## Overview

The Account Lockout feature is a critical security enhancement that protects user accounts from brute force attacks by temporarily locking accounts after multiple failed login attempts.

## Features

### 🔒 Automatic Account Lockout

- **Maximum Failed Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Automatic Unlock**: Accounts automatically unlock after the lockout period expires

### 🛡️ Security Monitoring

- Tracks failed login attempts per user
- Records timestamps of login attempts
- Creates audit logs for security events
- Provides detailed lockout status information

### 👥 Administrative Controls

- Manual account unlock by administrators
- Force account lock for security reasons
- View locked accounts and their status
- Account security monitoring dashboard

## API Endpoints

### Authentication Flow

The login endpoint now includes account lockout protection:

```typescript
POST / auth / login;
```

**Response Changes:**

- Successful login: Same as before
- Failed login: Shows remaining attempts
- Locked account: Shows lockout expiration time

### Admin Management Endpoints

#### Unlock Account

```http
POST /admin/accounts/:userId/unlock
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "User requested unlock"
}
```

#### Lock Account

```http
POST /admin/accounts/:userId/lock
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Suspicious activity detected"
}
```

#### Get Account Status

```http
GET /admin/accounts/:userId/status
Authorization: Bearer <admin-token>
```

#### Get All Locked Accounts

```http
GET /admin/accounts/locked
Authorization: Bearer <admin-token>
```

## Database Schema Changes

### User Model Enhancements

```sql
-- New fields added to User model:
failedLoginAttempts  Int            @default(0)
lockedUntil          DateTime?
lastLoginAttempt     DateTime?
```

### Audit Log Events

The system creates audit logs for the following events:

- `account_locked` - Automatic lock after max attempts
- `account_unlocked` - Manual unlock by admin
- `account_force_locked` - Manual lock by admin
- `login_success` - Successful login (resets failed attempts)

## Configuration

### Environment Variables

The lockout settings are currently hardcoded but can be made configurable:

```typescript
// In account-lockout.service.ts
private readonly MAX_FAILED_ATTEMPTS = 5;
private readonly LOCKOUT_DURATION_MINUTES = 15;
```

### Future Configuration Options

```env
ACCOUNT_LOCKOUT_MAX_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=15
ACCOUNT_LOCKOUT_ENABLED=true
```

## Security Benefits

### 🎯 Brute Force Protection

- Prevents automated password guessing attacks
- Rate limits login attempts per account
- Increases attacker's time and resource requirements

### 📊 Monitoring & Alerting

- Detailed audit trail for security incidents
- Real-time lockout status tracking
- Administrative oversight capabilities

### 🔐 User Experience

- Clear error messages with remaining attempts
- Automatic unlock reduces support overhead
- Professional security posture builds trust

## Error Messages

### Failed Login Attempts

```
"Invalid credentials. 3 attempts remaining."
```

### Account Locked

```
"Account is temporarily locked. Try again after 12/31/2024, 2:30:45 PM"
```

### Maximum Attempts Reached

```
"Account is temporarily locked due to too many failed attempts."
```

## Testing

### Unit Tests

Comprehensive test suite covering:

- Failed login attempt tracking
- Account lockout triggers
- Automatic unlock functionality
- Administrative controls
- Edge cases and error scenarios

### Test Commands

```bash
# Run account lockout tests
npm test -- account-lockout.service.spec.ts

# Run all auth tests
npm test -- auth/
```

## Implementation Details

### Service Architecture

- **AccountLockoutService**: Core lockout logic
- **AuthService**: Integration with login flow
- **AccountManagementController**: Admin endpoints
- **Prisma Schema**: Database layer

### Security Considerations

- All lockout operations are logged
- Time-based locks prevent permanent account denial
- Admin-only access to management functions
- Audit trail for compliance requirements

## Future Enhancements

### Planned Features

1. **Configurable Policies**: Per-organization lockout settings
2. **Advanced Detection**: IP-based and device fingerprinting
3. **Notification System**: Email alerts for lockouts
4. **Graduated Lockouts**: Increasing durations for repeat offenses
5. **Self-Service Unlock**: Email verification for automatic unlock

### Integration Opportunities

- SIEM systems for security monitoring
- SOC workflows for incident response
- Compliance reporting tools
- User behavior analytics

## Migration Guide

### Database Migration

The Prisma schema changes require a migration:

```bash
npx prisma migrate dev --name add-account-lockout
```

### Backward Compatibility

- Existing users start with 0 failed attempts
- No disruption to current login flow
- Graceful handling of missing lockout fields

## Support & Troubleshooting

### Common Issues

1. **Users locked out accidentally**: Use admin unlock endpoint
2. **Lockout duration too short/long**: Adjust service constants
3. **Missing audit logs**: Check Prisma connection and permissions

### Monitoring

Monitor these metrics:

- Account lockout frequency
- Time to unlock (natural vs manual)
- Failed login patterns
- Admin intervention rates

## Security Compliance

This feature helps with compliance requirements:

- **OWASP Top 10**: Addresses brute force attacks (A07:2021)
- **SOC 2**: Security monitoring and incident response
- **ISO 27001**: Access control and incident management
- **GDPR**: Data protection and security measures
