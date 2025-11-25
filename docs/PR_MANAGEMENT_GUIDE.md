# Pull Request Management Guide

## 📋 Overview

This guide provides comprehensive instructions for managing pull requests in the JasaWeb monorepo to ensure code quality, security, and efficient development workflow.

## 🎯 PR Categories & Priorities

### Critical Priority (Immediate Action)
- **Security PRs** (`security` label): Authentication vulnerabilities, data exposure
- **Hotfix PRs** (`hotfix` label): Production issues, critical bugs
- **Main branch updates**: Core infrastructure changes

### High Priority 
- **Feature PRs** (`feature` label): New functionality
- **Major bug fixes** (`bug` label): Important functionality fixes
- **Performance improvements** (`performance` label)

### Medium Priority
- **Code refactoring** (`maintenance` label): Code quality improvements
- **Documentation updates** (`docs` label): Documentation changes
- **Minor bug fixes**: Non-critical issues

### Low Priority
- **Style/formatting** (`style` label): Code formatting only
- **Dependency updates**: Automated dependency updates

## 🚀 PR Creation Workflow

### 1. Before Creating PR
```bash
# Ensure your branch is up to date
git checkout main
git pull origin main
git checkout your-feature-branch
git rebase main

# Run all quality checks
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

### 2. Create Feature Branch
```bash
# Use conventional commit naming
git checkout -b feature/user-authentication
git checkout -b fix/database-connection-issue
git checkout -b security/jwt-secret-fix
```

### 3. Submit PR
- Link to related issues using `Fixes #123`, `Closes #123`
- Add appropriate labels based on priority/type
- Fill out the PR template completely
- Add `do-not-merge` label if work in progress

## 🔍 PR Review Process

### Required Approvals
- **All PRs**: At least one team member approval
- **Security PRs**: Security team review required
- **Breaking changes**: Team consensus required
- **Infrastructure changes**: DevOps review required

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security implications reviewed
- [ ] Performance impact assessed
- [ ] Breaking changes documented
- [ ] Database migrations tested (if applicable)

### Automated Checks
All PRs must pass:
- **Linting**: ESLint configuration compliance
- **Type checking**: TypeScript compilation
- **Unit tests**: Jest test suite
- **Integration tests**: API endpoint tests
- **Build verification**: All apps build successfully
- **Security scan**: Dependency vulnerability check

## 🤖 Mergify Configuration

### Queue Rules
- **Default Queue**: Requires all checks to pass, batch processing enabled
- **Hotfix Queue**: Expedited for security/critical fixes
- **Conflict Prevention**: PRs with merge conflicts are blocked

### Priority Rules
- **Critical**: Security, hotfix, main branch PRs
- **Medium**: Feature PRs targeting main branch
- **Normal**: All other PRs based on labels

### Merge Conditions
- All required checks must pass
- No merge conflicts
- Required approvals received
- PR not in draft state

## 🏷️ Label Management

### Standard Labels
- `security` - Critical security vulnerabilities
- `hotfix` - Urgent production fixes
- `high-priority` - Important features/fixes
- `feature` - New functionality
- `bug` - Non-critical bug fixes
- `maintenance` - Code cleanup, dependencies
- `docs` - Documentation changes
- `performance` - Performance improvements
- `do-not-merge` - Work in progress

### Automated Labeling
- Security fixes automatically labeled via PR title analysis
- Breaking changes require manual `breaking-change` label
- Draft PRs automatically get `do-not-merge` label

## 🔄 Branch Management

### Protected Branch: `main`
- Direct pushes disabled
- PR review required
- Status checks required
- Force pushes disabled

### Feature Branches
- Delete after merge (configured automatically)
- Keep up to date with main (rebase recommended)
- Use conventional naming: `type/description`

### Release Branches
- Created from main for releases
- Bug fixes cherry-picked from main
- Merge back to main after release

## 🚫 Duplicate PR Prevention

### Before Creating PR
1. **Search existing PRs**: Check if similar work in progress
2. **Check issues**: Link to related GitHub issues
3. **Team communication**: Discuss major changes in team meetings

### Handling Duplicates
- **Identify duplicates**: Similar title/description PRs
- **Consolidate efforts**: Merge work into single PR
- **Close duplicates**: With reference to primary PR
- **Document decisions**: In closing comment

## 📊 PR Metrics & Monitoring

### Key Metrics
- **Average PR lifetime**: Target < 3 days for features
- **Time to first review**: Target < 24 hours
- **Merge rate**: Track successful merges vs. opened PRs
- **Revert rate**: Monitor PRs that need reverting

### Monitoring Tools
- GitHub Insights repository statistics
- Mergify dashboard for queue status
- CI/CD pipeline metrics
- Team communication channels

## 🔧 Troubleshooting

### Common Issues

#### PR Fails Checks
1. **Check logs**: Review CI/CD failure logs
2. **Local reproduction**: Run failing checks locally
3. **Fix issues**: Address specific failures
4. **Re-run**: Trigger checks manually if needed

#### Merge Conflicts
1. **Update branch**: Rebase against main
2. **Resolve conflicts**: Edit conflicting files
3. **Test locally**: Ensure resolution works
4. **Commit changes**: Continue with resolution

#### Review Bottlenecks
1. **Tag reviewers**: Use @mentions to request reviews
2. **Set PR size limits**: Break large PRs into smaller ones
3. **Document changes**: Clear descriptions help reviews
4. **Use draft PRs**: Early feedback on work in progress

## 📚 Best Practices

### For Authors
- **Small, focused PRs**: Easier to review and merge
- **Clear descriptions**: Explain what, why, and how
- **Test thoroughly**: Include comprehensive test coverage
- **Document changes**: Update relevant documentation

### For Reviewers
- **Timely reviews**: Respond within 24 hours when possible
- **Constructive feedback**: Clear, actionable suggestions
- **Security awareness**: Look for potential vulnerabilities
- **Performance impact**: Consider scalability implications

### For Maintainers
- **Consistent process**: Apply rules uniformly
- **Team communication**: Share important decisions
- **Tool improvements**: Enhance workflows regularly
- **Knowledge sharing**: Help team grow practices

## 🎯 Success Metrics

### Quality Indicators
- **Zero security vulnerabilities** in merged code
- **≥80% test coverage** on new code
- **No broken builds** in main branch
- **Minimal reverts** (< 5% of merged PRs)

### Velocity Indicators
- **Average PR turnaround** under 3 days
- **≥90% of PRs merged** within 1 week
- **Team productivity** improvements
- **Feature delivery** on schedule

## 🔄 Continuous Improvement

### Regular Reviews
- Monthly PR process review
- Quarterly Mergify configuration optimization
- Annual workflow assessment
- Team feedback collection

### Tooling Updates
- Monitor new GitHub features
- Evaluate Mergify Pro capabilities
- Consider additional automation
- Integrate improved testing tools

---

**This guide should be reviewed and updated quarterly to ensure alignment with team practices and tooling improvements.**
