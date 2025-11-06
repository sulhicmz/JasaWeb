# GitHub Issue Templates

This directory contains comprehensive issue templates for the JasaWeb repository, designed to prevent duplicate issues and streamline the issue reporting process.

## 📁 Template Files

### Core Templates
- **`bug_report.yml`** - Enhanced bug report with duplicate prevention fields
- **`feature_request.yml`** - Feature request with problem statement and acceptance criteria
- **`technical_task.yml`** - Technical implementation tasks
- **`release.yml`** - Release tracking and deployment coordination

### Specialized Templates
- **`security_issue.yml`** - Security vulnerability reporting (non-critical)
- **`build_ci_issue.yml`** - Build failures, CI/CD pipeline issues
- **`configuration_issue.yml`** - Environment setup and configuration problems

### Configuration
- **`config.yml`** - Issue form configuration and contact links
- **`GUIDE.md`** - Comprehensive guide for choosing and using templates

### Automation
- **`../workflows/issue-validation.yml`** - Automated issue validation and duplicate detection
- **`../scripts/validate-issue.js`** - Issue validation logic

## 🎯 Key Features

### Duplicate Prevention
- **Required fields** for related issues and keywords
- **Automated validation** checks for completeness
- **Duplicate detection** suggests similar issues
- **Risk assessment** categorizes duplicate potential

### Issue Quality
- **Structured templates** guide users to provide complete information
- **Type-specific fields** ensure relevant details are captured
- **Validation checks** prevent incomplete submissions
- **Helpful suggestions** improve issue quality

### Automation
- **GitHub Actions** automatically validate new issues
- **Smart labeling** based on validation results
- **Duplicate suggestions** help maintainers triage faster
- **Quality scoring** identifies issues needing attention

## 🚀 Usage

### For Contributors
1. Choose the appropriate template for your issue
2. Fill in all required fields completely
3. Provide detailed reproduction steps and environment information
4. Include relevant error messages and logs
5. Search for similar issues before submitting

### For Maintainers
1. Review automated validation comments
2. Check duplicate risk assessment
3. Use suggested search terms to find related issues
4. Apply appropriate labels based on validation results
5. Guide contributors to improve incomplete issues

## 🔧 Customization

### Adding New Templates
1. Create new `.yml` file in this directory
2. Follow the established structure and naming conventions
3. Include duplicate prevention fields
4. Update the `GUIDE.md` with new template information
5. Test the template functionality

### Modifying Existing Templates
1. Update the `.yml` file with desired changes
2. Maintain required fields for duplicate prevention
3. Update validation logic in `validate-issue.js` if needed
4. Update documentation in `GUIDE.md`
5. Test changes thoroughly

### Validation Rules
Update the `IssueValidator` class in `validate-issue.js` to:
- Add new validation rules
- Modify duplicate detection logic
- Update type-specific validations
- Adjust risk assessment criteria

## 📊 Metrics

The issue templates are designed to track:
- **Duplicate reduction** - Monitor duplicate issue rates
- **Time to triage** - Measure how quickly issues are processed
- **Issue quality** - Track completeness and detail levels
- **Resolution time** - Monitor how quickly issues are resolved

## 🔍 Troubleshooting

### Common Issues
- **Templates not appearing**: Check `config.yml` configuration
- **Validation not working**: Verify GitHub Actions permissions
- **Duplicate detection failing**: Check API rate limits and search syntax
- **Labels not applying**: Ensure proper GitHub permissions

### Debug Mode
Enable debug logging by setting repository secrets:
- `ACTIONS_STEP_DEBUG: true`
- `ACTIONS_RUNNER_DEBUG: true`

## 📚 Related Documentation

- [GitHub Issue Forms Documentation](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Project Contributing Guidelines](../../CONTRIBUTING.md)
- [Code of Conduct](../../CODE_OF_CONDUCT.md)

## 🤝 Contributing

To improve the issue templates:
1. Test template changes in a fork
2. Update documentation for any changes
3. Ensure validation logic matches template fields
4. Consider impact on existing workflows
5. Submit changes with clear descriptions

---

**Last Updated**: 2025-11-06  
**Version**: 2.0.0  
**Maintainers**: JasaWeb Core Team