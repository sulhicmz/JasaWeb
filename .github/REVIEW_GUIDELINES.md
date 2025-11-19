# Code Review Guidelines

## 🎯 Review Process

### 1. Automated Checks

All PRs must pass:

- ✅ ESLint checks
- ✅ TypeScript compilation
- ✅ Unit tests
- ✅ Security audit
- ✅ Build verification

### 2. Review Requirements

- **Main branch**: Minimum 2 approvals required
- **Develop branch**: Minimum 1 approval required
- **Release branches**: Minimum 2 approvals required

### 3. Review Focus Areas

#### Code Quality

- [ ] Code follows project conventions and style guide
- [ ] Functions and variables are properly named
- [ ] Code is readable and maintainable
- [ ] No hardcoded values or magic numbers
- [ ] Proper error handling implemented

#### Functionality

- [ ] Implementation matches requirements
- [ ] Edge cases are handled
- [ ] Performance implications considered
- [ ] Security best practices followed
- [ ] Backward compatibility maintained (if applicable)

#### Testing

- [ ] Adequate test coverage
- [ ] Tests cover edge cases
- [ ] Tests are meaningful and not redundant
- [ ] Integration tests included where necessary

#### Documentation

- [ ] Code comments where necessary
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Changelog updated (if applicable)

## 🔄 Review Workflow

### For Reviewers

1. **Initial Review**: Check automated status first
2. **Code Review**: Focus on logic, architecture, and best practices
3. **Testing Review**: Verify test coverage and quality
4. **Documentation Review**: Ensure docs are updated
5. **Approval**: Approve if all criteria met, otherwise provide constructive feedback

### For Authors

1. **Self-Review**: Review your own code before requesting review
2. **Address Feedback**: Respond to all review comments
3. **Update PR**: Make necessary changes based on feedback
4. **Re-request Review**: Ask reviewers to re-review after changes

## 📝 Review Comments Guidelines

### Good Review Comments

- ✅ Specific and actionable
- ✅ Explain the "why" behind suggestions
- ✅ Provide examples or alternatives
- ✅ Be constructive and respectful
- ✅ Focus on the code, not the person

### Comment Types

- **🔍 Observation**: General feedback or suggestion
- **⚠️ Issue**: Problem that needs to be fixed
- **💡 Suggestion**: Improvement idea
- **📚 Question**: Clarification needed
- **✅ Approval**: Change looks good

## 🚨 Blocking Issues

PRs will be blocked if they contain:

- Security vulnerabilities
- Breaking changes without proper discussion
- Performance regressions
- Missing test coverage for critical paths
- Violation of project conventions

## 🏆 Review Best Practices

### For Reviewers

- Review within 24 hours of request
- Provide clear, actionable feedback
- Acknowledge good work and improvements
- Ask questions to understand context
- Suggest alternatives when pointing out issues

### For Authors

- Keep PRs focused and reasonably sized
- Provide clear descriptions and context
- Respond to feedback promptly
- Explain design decisions when questioned
- Thank reviewers for their time and feedback
