# Issue Templates Guide

## 📋 Choosing the Right Template

Select the appropriate template based on your issue type:

### 🐛 Bug Report
**Use when**: Something is broken or not working as expected
- Application crashes or errors
- Features not working correctly
- Unexpected behavior
- Performance issues
- UI/UX problems

### ✨ Feature Request
**Use when**: You want to suggest new functionality
- New features or capabilities
- Enhancements to existing features
- UI/UX improvements
- New integrations
- Process improvements

### 🔒 Security Issue
**Use when**: Security-related concerns (non-critical)
- Security vulnerabilities
- Authentication/authorization issues
- Data protection concerns
- Security best practice violations
- Dependency security issues

**⚠️ CRITICAL security vulnerabilities**: Email security@jasaweb.com instead

### 🔨 Build/CI Issue
**Use when**: Build, CI/CD, or deployment problems
- Build failures
- Test failures in CI
- Workflow errors
- Deployment issues
- Pipeline configuration problems

### ⚙️ Configuration Issue
**Use when**: Environment or setup problems
- Environment variable issues
- Database connection problems
- Development environment setup
- Docker configuration
- Third-party service configuration

### 🔧 Technical Task
**Use when**: Implementation work that doesn't fit other categories
- Code refactoring
- Performance optimization
- Testing improvements
- Documentation updates
- Infrastructure changes

### 🚀 Release
**Use when**: Tracking release activities
- Version releases
- Deployment coordination
- Release notes
- Rollback planning

---

## 🔍 Preventing Duplicate Issues

### Before Creating an Issue:
1. **Search existing issues** using relevant keywords
2. **Check recent issues** for similar problems
3. **Review documentation** for known solutions
4. **Check Discussions** for ongoing conversations

### Required Fields for Duplicate Prevention:
- **Related Issues**: Link any existing related issues (#123, #456, or "None")
- **Keywords**: Provide key terms that describe your issue
- **Confirmation**: Confirm you've searched for duplicates

### Search Tips:
- Use error messages, component names, and action words
- Check both open and closed issues
- Try different keyword combinations
- Look for issues with similar labels

---

## 📝 Issue Quality Guidelines

### Provide Complete Information:
- **Clear descriptions**: What happened vs. what should happen
- **Reproduction steps**: Detailed, step-by-step instructions
- **Environment details**: OS, browser, versions, etc.
- **Error messages**: Complete error logs and stack traces
- **Screenshots**: When visual context helps

### Security Guidelines:
- **NEVER** include passwords, API keys, or secrets
- Use placeholder values like `***` or `example-value`
- For critical security issues, email security@jasaweb.com

### Code and Configuration:
- Use code blocks with proper syntax highlighting
- Sanitize sensitive information before sharing
- Include relevant file paths and line numbers
- Provide minimal reproduction examples when possible

---

## 🚨 Urgent Issues

For urgent issues affecting production or blocking development:
1. Use the appropriate template
2. Add the `urgent` label
3. Mention @jasaweb/core-team in a comment
4. Provide detailed impact assessment

---

## 📚 Additional Resources

- [Project Documentation](../../README.md)
- [CI/CD Optimization Guide](../../.github/CICD_OPTIMIZATION.md)
- [Security Best Practices](../../docs/SECURITY_BEST_PRACTICES.md)
- [Troubleshooting Guide](../../docs/EMERGENCY_RESOLUTION_PLAN.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)

---

## 🤝 Contributing

Thank you for helping improve JasaWeb! Your detailed issue reports help us:
- Identify and fix problems faster
- Prioritize development work effectively
- Build better documentation
- Prevent duplicate issues
- Improve the overall quality of the project

For questions about issue templates or reporting, start a [Discussion](https://github.com/jasaweb/jasaweb/discussions).