# Security Best Practices for JasaWeb

This document outlines security best practices for developers working on the JasaWeb project.

## 🔐 Authentication & Authorization

### Password Security

```typescript
// ✅ DO: Use bcrypt with sufficient rounds
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

// ❌ DON'T: Store passwords in plain text
const password = 'user_password'; // Never do this!
```

### JWT Token Security

```typescript
// ✅ DO: Use strong secrets and short expiration times
JWT_SECRET=<strong-256-bit-random-string>
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

// ❌ DON'T: Use weak secrets or long expiration times
JWT_SECRET=secret123 // Too weak!
JWT_EXPIRES_IN=365d // Too long!
```

### Session Management

```typescript
// ✅ DO: Implement secure session handling
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  // Protected endpoint
}

// ❌ DON'T: Leave endpoints unprotected
export class AdminController {
  // Anyone can access this!
}
```

## 🛡️ Input Validation

### Validate All Inputs

```typescript
// ✅ DO: Use class-validator for DTOs
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}

// ❌ DON'T: Accept raw inputs without validation
export class CreateUserDto {
  email: string; // No validation!
  password: string; // No validation!
}
```

### Sanitize Inputs

```typescript
// ✅ DO: Sanitize user inputs
import { Transform } from 'class-transformer';

export class SearchDto {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString()
  query: string;
}

// ❌ DON'T: Use raw user input directly
const query = req.query.search; // Dangerous!
const results = await db.query(`SELECT * FROM users WHERE name = '${query}'`);
```

## 🔒 Data Protection

### Environment Variables

```bash
# ✅ DO: Use environment variables for secrets
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=<strong-random-secret>

# ❌ DON'T: Hardcode secrets in code
const JWT_SECRET = 'my-secret-key'; // Never do this!
```

### Sensitive Data Handling

```typescript
// ✅ DO: Exclude sensitive fields from responses
export class UserEntity {
  id: string;
  email: string;
  name: string;

  @Exclude()
  password: string;

  @Exclude()
  refreshToken: string;
}

// ❌ DON'T: Return sensitive data
return {
  id: user.id,
  email: user.email,
  password: user.password, // Never expose this!
};
```

## 🚫 SQL Injection Prevention

### Use Parameterized Queries

```typescript
// ✅ DO: Use Prisma ORM with parameterized queries
const user = await prisma.user.findUnique({
  where: { email: userEmail },
});

// ❌ DON'T: Use string concatenation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`; // SQL Injection risk!
```

## 🌐 XSS Prevention

### Content Security Policy

```typescript
// ✅ DO: Implement CSP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// ❌ DON'T: Allow unsafe inline scripts
contentSecurityPolicy: false // Dangerous!
```

### Sanitize HTML

```typescript
// ✅ DO: Sanitize HTML content
import * as DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);

// ❌ DON'T: Use innerHTML with user input
element.innerHTML = userInput; // XSS risk!
```

## 🔐 CSRF Protection

### Use CSRF Tokens

```typescript
// ✅ DO: Implement CSRF protection
import * as csurf from 'csurf';

app.use(csurf({ cookie: true }));

// ❌ DON'T: Accept state-changing requests without CSRF tokens
@Post()
deleteUser(@Param('id') id: string) {
  // No CSRF protection!
}
```

## 🚦 Rate Limiting

### Implement Rate Limiting

```typescript
// ✅ DO: Use rate limiting for sensitive endpoints
@UseGuards(RateLimitGuard)
@RateLimit(5, 60000) // 5 requests per minute
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Protected endpoint
}

// ❌ DON'T: Leave endpoints without rate limiting
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Vulnerable to brute force attacks!
}
```

## 📝 Logging & Monitoring

### Secure Logging

```typescript
// ✅ DO: Log security events without sensitive data
logger.log({
  event: 'login_attempt',
  userId: user.id,
  ip: request.ip,
  success: true,
});

// ❌ DON'T: Log sensitive information
logger.log({
  event: 'login_attempt',
  password: password, // Never log passwords!
  creditCard: user.creditCard, // Never log sensitive data!
});
```

## 🐳 Docker Security

### Secure Dockerfile

```dockerfile
# ✅ DO: Use non-root user
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

# ❌ DON'T: Run as root
FROM node:20-alpine
# Running as root by default - dangerous!
```

### Security Options

```yaml
# ✅ DO: Use security options in docker-compose
services:
  api:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp

# ❌ DON'T: Run without security options
services:
  api:
    # No security options - vulnerable!
```

## 🔍 Code Review Checklist

### Before Committing

- [ ] No hardcoded secrets or credentials
- [ ] All inputs are validated and sanitized
- [ ] Sensitive data is not logged
- [ ] Authentication and authorization are properly implemented
- [ ] SQL injection prevention is in place
- [ ] XSS prevention is implemented
- [ ] CSRF protection is enabled
- [ ] Rate limiting is configured
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies are up to date

### Security Testing

```bash
# Run security audit
pnpm security:audit

# Run security scan
pnpm security:scan

# Run tests
pnpm test

# Check for outdated dependencies
pnpm security:outdated
```

## 🚨 Common Vulnerabilities to Avoid

### 1. Hardcoded Secrets

```typescript
// ❌ BAD
const API_KEY = 'sk_live_1234567890abcdef';

// ✅ GOOD
const API_KEY = process.env.API_KEY;
```

### 2. Weak Password Policies

```typescript
// ❌ BAD
@MinLength(4)
password: string;

// ✅ GOOD
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
password: string;
```

### 3. Insecure Direct Object References

```typescript
// ❌ BAD
@Get(':id')
async getUser(@Param('id') id: string) {
  return this.userService.findOne(id); // No authorization check!
}

// ✅ GOOD
@Get(':id')
@UseGuards(JwtAuthGuard)
async getUser(@Param('id') id: string, @Request() req) {
  if (req.user.id !== id && !req.user.isAdmin) {
    throw new ForbiddenException();
  }
  return this.userService.findOne(id);
}
```

### 4. Missing Error Handling

```typescript
// ❌ BAD
@Post()
async createUser(@Body() dto: CreateUserDto) {
  return await this.userService.create(dto); // No error handling!
}

// ✅ GOOD
@Post()
async createUser(@Body() dto: CreateUserDto) {
  try {
    return await this.userService.create(dto);
  } catch (error) {
    this.logger.error('Failed to create user', error);
    throw new InternalServerErrorException('Failed to create user');
  }
}
```

### 5. Insufficient Logging

```typescript
// ❌ BAD
@Post('login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto); // No logging!
}

// ✅ GOOD
@Post('login')
@UseInterceptors(SecurityAuditInterceptor)
async login(@Body() dto: LoginDto, @Request() req) {
  this.logger.log(`Login attempt from ${req.ip} for ${dto.email}`);
  const result = await this.authService.login(dto);
  this.logger.log(`Login ${result.success ? 'successful' : 'failed'} for ${dto.email}`);
  return result;
}
```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security](https://www.typescriptlang.org/docs/handbook/security.html)

## ⚠️ TypeScript Configuration Security

### skipLibCheck Setting

The `skipLibCheck` option in `tsconfig.json` can improve compilation speed by skipping type checking of declaration files. However, it may mask potential type conflicts between your application code and third-party dependencies, which could lead to unexpected runtime issues.

**Recommendation**: 
- Set `skipLibCheck: false` for full type safety across the entire dependency tree
- Only set `skipLibCheck: true` when there are specific, well-understood compatibility issues with certain libraries
- Document any decision to use `skipLibCheck: true` with the trade-offs involved

## 🔄 Regular Security Tasks

### Daily
- Review security alerts from Dependabot
- Monitor application logs for suspicious activity

### Weekly
- Run security audit: `pnpm security:audit`
- Review and update dependencies
- Check for new security advisories

### Monthly
- Review and update security policies
- Conduct security training for team
- Review access controls and permissions

### Quarterly
- Conduct penetration testing
- Review and update threat model
- Security audit of entire codebase

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the security team!

**Last Updated**: 2025-11-05
**Version**: 1.0.0
