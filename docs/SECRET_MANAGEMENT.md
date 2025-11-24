# Secret Management Best Practices

This document outlines the best practices for managing secrets and credentials in the JasaWeb project to prevent security vulnerabilities and ensure compliance with secret detection systems.

## 🚫 What NOT to Commit

Never commit the following to version control:

- Real API keys, tokens, or passwords
- Database connection strings with real credentials
- Private keys or certificates
- Environment files with real values (`.env`, `.env.local`, etc.)
- Service account credentials
- OAuth client secrets

## ✅ Acceptable in Code

The following are acceptable when clearly marked as test/mock data:

- Test passwords with obvious test prefixes (e.g., `test-pass-123`, `mock-token`)
- Mock API keys that are clearly fake (e.g., `test-api-key`, `mock-secret`)
- Example configuration in `.env.example` files
- Documentation with placeholder values

## 📁 Environment Files

### `.env.example` Files

- Use placeholder values that clearly indicate they need to be replaced
- Include comments explaining each variable
- Example: `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production`

### `.env` Files

- Never commit `.env` files to version control
- Add `.env` to `.gitignore`
- Use different `.env` files for different environments

## 🧪 Test Files

Test files may contain hardcoded credentials, but they should:

- Use obvious test prefixes (`test-`, `mock-`, `fake-`, `dummy-`)
- Avoid realistic-looking passwords or keys
- Not use production-like patterns

### Good Examples:

```typescript
password: 'test-pass-123';
token: 'test-access-token';
secret: 'mock-secret-key';
```

### Bad Examples:

```typescript
password: 'SuperSecret123!';
token: 'sk-1234567890abcdef';
secret: 'my-real-secret-key';
```

## 🔍 Secret Detection

Our security scanning system (`scripts/security-scan.js`) automatically:

- Scans for hardcoded secrets in source code
- Excludes test files from secret detection
- Ignores common test patterns
- Checks for `.env` files in git history

## 🛠️ Development Practices

1. **Use environment variables** for all configuration
2. **Never log secrets** or sensitive data
3. **Use different secrets** for different environments
4. **Rotate secrets regularly**
5. **Use secret management services** in production (AWS Secrets Manager, etc.)

## 🚨 Incident Response

If a secret is accidentally committed:

1. **Immediately revoke** the compromised secret
2. **Remove the secret** from the code
3. **Rotate to a new secret**
4. **Consider the branch compromised** and rotate all secrets
5. **Update documentation** if needed

## 🔧 Tools and Configuration

### Security Scan Script

Run the security scan locally:

```bash
node scripts/security-scan.js
```

### Git Hooks

Consider adding pre-commit hooks to prevent secret commits:

```bash
# Example pre-commit hook to check for secrets
#!/bin/sh
# Prevent commits with potential secrets
if git diff --cached --name-only | xargs grep -l "password\|secret\|key" 2>/dev/null; then
  echo "Warning: Potential secrets detected in staged files"
  exit 1
fi
```

## 📚 Additional Resources

- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secret_Management_Cheat_Sheet.html)
- [GitHub Security Best Practices](https://docs.github.com/en/security)
- [Node.js Security Best Practices](https://github.com/goldbergyoni/nodebestpractices#-security-best-practices)

---

**Remember**: When in doubt, treat it as a secret and keep it out of version control!
