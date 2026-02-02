# JasaWeb Architectural Audit Command

## Overview
Comprehensive architectural audit command that validates JasaWeb codebase against the 99.8/100 score requirements and identifies any compliance issues.

## Usage
```
@jasaweb-audit [scope] [options]
```

## Parameters

### Scope (optional)
- `full` - Complete architectural audit (default)
- `security` - Security-focused audit only
- `performance` - Performance audit only
- `testing` - Test coverage audit only
- `compliance` - AGENTS.md compliance audit only

### Options
- `--fix` - Automatically fix minor issues found
- `--report` - Generate detailed audit report
- `--threshold` - Set minimum acceptable score (default: 99.8)

## Audit Categories

### 1. Architectural Compliance (99.8/100 Score)
- **Environment Access**: Verify `locals.runtime.env` usage (18/18 endpoints)
- **Service Layer**: Check for direct database access violations
- **Error Handling**: Validate `handleApiError()` usage (61 endpoints)
- **API Responses**: Ensure standardized response patterns
- **Component Architecture**: Validate proper component organization

### 2. Security Excellence (100/100 Score)
- **Environment Security**: Check for secret exposure risks
- **CSRF Protection**: Validate implementation completeness
- **Rate Limiting**: Verify sensitive endpoint protection
- **Payment Security**: Check Midtrans signature validation
- **Input Validation**: Ensure comprehensive validation patterns

### 3. Performance Standards (95/100 Score)
- **Query Performance**: Validate sub-2ms query targets
- **Bundle Size**: Check < 200KB constraint (current: 189.71KB)
- **Cache Performance**: Verify Redis hit rates (target: 89%)
- **Database Indexing**: Validate performance optimization
- **Build Performance**: Check build time and optimization

### 4. Testing Excellence (99/100 Score)
- **Test Coverage**: Validate 464-test baseline maintenance
- **Pass Rate**: Ensure 100% test success rate
- **E2E Testing**: Check critical workflow coverage
- **Performance Testing**: Validate load testing implementation
- **Security Testing**: Verify security test coverage

### 5. Code Quality Standards
- **Type Safety**: Zero TypeScript errors validation
- **ESLint Compliance**: Check for linting violations
- **Documentation**: Validate JSDoc coverage
- **Naming Conventions**: Check consistent naming patterns
- **Code Duplication**: Identify and report duplicate code

## Implementation Process

### Phase 1: Automated Analysis
```bash
# Environment access validation
grep -r "import.meta.env" src/ --exclude-dir=node_modules
grep -r "locals.runtime.env" src/ --exclude-dir=node_modules

# Service layer compliance
find src/pages/ -name "*.astro" -exec grep -l "prisma\|db\." {} \;

# Error handling validation
find src/pages/api/ -name "*.ts" -exec grep -L "handleApiError" {} \;

# API response patterns
find src/pages/api/ -name "*.ts" -exec grep -L "jsonResponse\|errorResponse" {} \;
```

### Phase 2: Performance Analysis
```bash
# Bundle size analysis
pnpm build && du -sh dist/

# Query performance testing
pnpm test:performance

# Cache performance validation
pnpm test:cache
```

### Phase 3: Security Validation
```bash
# CSRF protection check
find src/pages/api/ -name "*.ts" -exec grep -L "csrf" {} \;

# Rate limiting validation
find src/pages/api/ -name "*.ts" -exec grep -L "rateLimit" {} \;

# Payment security validation
grep -r "midtrans\|webhook" src/ --exclude-dir=node_modules
```

### Phase 4: Testing Analysis
```bash
# Test coverage analysis
pnpm test:coverage

# Test execution validation
pnpm test

# E2E testing validation
pnpm test:e2e
```

## Scoring System

### Overall Score Calculation
```
Architectural Compliance: 40% weight
Security Excellence: 25% weight
Performance Standards: 20% weight
Testing Excellence: 10% weight
Code Quality: 5% weight
```

### Score Breakdown
- **99.8-100**: Exemplary worldclass architecture
- **95-97.9**: Excellent with minor improvements needed
- **90-94.9**: Good with notable improvements required
- **Below 90**: Requires significant architectural improvements

## Report Format

### Executive Summary
```
## JasaWeb Architectural Audit Report
**Date**: [timestamp]
**Overall Score**: [score]/100
**Status**: [PASS/FAIL/NEEDS_IMPROVEMENT]

### Category Scores
- Architectural Compliance: [score]/100
- Security Excellence: [score]/100
- Performance Standards: [score]/100
- Testing Excellence: [score]/100
- Code Quality: [score]/100

### Critical Issues
[X] critical issues requiring immediate attention

### Recommendations
[Priority-ordered list of improvements]
```

### Detailed Findings
```
## Architectural Compliance Analysis
### Environment Access
- ✅ 18/18 endpoints using locals.runtime.env
- ❌ 2 endpoints using import.meta.env (FIXED)

### Service Layer
- ✅ Zero direct database access violations
- ✅ All .astro pages using service abstractions

### Security Analysis
### CSRF Protection
- ✅ All authenticated endpoints protected
- ✅ Proper token validation implemented

### Performance Analysis
### Bundle Size
- ✅ 189.71KB (target: < 200KB)
- ✅ Gzip compression: 60.75KB

### Testing Analysis
### Coverage
- ✅ 464 tests across 30 files
- ✅ 100% pass rate maintained
```

## Integration with Oh-My-OpenCode

### Agent Coordination
- **@jasaweb-architect**: Leads architectural compliance analysis
- **@jasaweb-security**: Performs security audit
- **@jasaweb-tester**: Validates testing coverage
- **@oracle**: Provides high-level architectural insights
- **@librarian**: Analyzes codebase patterns and documentation

### Background Processing
- Parallel analysis of different audit categories
- Concurrent validation across multiple code areas
- Automated report generation and scoring
- Real-time issue identification and categorization

## Automated Fixes

### Minor Issues (Auto-fixable)
- Import statement corrections
- Missing error handling additions
- Standardized response format updates
- Naming convention corrections

### Major Issues (Manual Review Required)
- Architectural pattern violations
- Security implementation gaps
- Performance optimization needs
- Test coverage improvements

## Success Criteria

### Passing Audit
- Overall score ≥ 99.8/100
- Zero critical security issues
- All categories ≥ 95/100
- No architectural violations

### Needs Improvement
- Overall score 95-97.9/100
- Minor security or performance issues
- Some architectural non-compliance
- Actionable improvement plan provided

### Failing Audit
- Overall score < 95/100
- Critical security issues present
- Major architectural violations
- Immediate remediation required

## Output
Comprehensive audit report including:
- Overall architectural score
- Detailed category analysis
- Specific issue identification
- Prioritized improvement recommendations
- Automated fixes where applicable
- Follow-up action plan

This command ensures JasaWeb maintains its worldclass architectural standards while providing clear guidance for continuous improvement and compliance with the 99.8/100 score requirements.