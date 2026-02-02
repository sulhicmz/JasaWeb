---
name: jasaweb-setup
description: Automated setup for new JasaWeb projects following established architectural patterns and maintaining 99.8/100 score compliance.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: project-setup
  category: automation
---

# JasaWeb Project Setup

## Overview
Automated setup for new JasaWeb projects following established architectural patterns and maintaining 99.8/100 score compliance.

## Usage
```
@skill jasaweb-setup
```

## Functionality

### 1. Project Initialization
- Creates standard directory structure following JasaWeb patterns
- Sets up configuration files with proper defaults
- Initializes database schema and migrations
- Configures development environment

### 2. Service Layer Setup
- Creates base service structure in `src/services/domain/` and `src/services/shared/`
- Sets up CRUD service abstractions
- Configures database connections and caching
- Establishes API response patterns

### 3. Component Architecture
- Sets up UI component library structure
- Creates shared component templates
- Configures styling system with CSS variables
- Establishes component documentation standards

### 4. Testing Infrastructure
- Creates test file structure following established patterns
- Sets up test utilities and helpers
- Configures test databases and fixtures
- Establishes E2E testing framework

### 5. Security Configuration
- Sets up authentication and authorization
- Configures CSRF protection
- Implements rate limiting
- Sets up secure environment variable handling

### 6. Development Tools
- Configures ESLint and TypeScript
- Sets up build optimization
- Configures development server
- Establishes CI/CD pipeline templates

## Implementation Steps

### Step 1: Directory Structure Creation
```bash
# Create standard JasaWeb directories
mkdir -p src/{components/{ui,shared},layouts,lib,services/{domain,shared},pages/{api,admin,dashboard}}
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs/{api,development,deployment}
```

### Step 2: Configuration Files
- `astro.config.mjs` - Astro configuration with optimizations
- `tsconfig.json` - TypeScript configuration with strict settings
- `vitest.config.ts` - Test configuration with coverage settings
- `eslint.config.js` - Linting configuration following JasaWeb standards

### Step 3: Service Layer Templates
- Base CRUD service class
- API response utilities
- Database connection management
- Caching service setup

### Step 4: Component Templates
- UI component base template with TypeScript interfaces
- Shared component structure
- Styling system configuration
- Documentation templates

### Step 5: Testing Setup
- Test utilities and helpers
- Database test setup
- API endpoint testing templates
- E2E test configuration

### Step 6: Security Setup
- Authentication middleware
- CSRF protection implementation
- Rate limiting configuration
- Environment variable validation

## Quality Assurance

### Validation Checks
- [ ] Directory structure follows JasaWeb patterns
- [ ] All configuration files are properly set up
- [ ] Service layer abstractions are implemented
- [ ] Component architecture is established
- [ ] Testing infrastructure is configured
- [ ] Security measures are implemented
- [ ] Development tools are configured

### Compliance Verification
- [ ] AGENTS.md rules are followed
- [ ] 99.8/100 architectural score requirements are met
- [ ] Security standards (100/100 score) are implemented
- [ ] Performance standards are configured
- [ ] Testing standards are established

## Integration with Oh-My-OpenCode

### Agent Coordination
- **@jasaweb-architect**: Validates architectural compliance
- **@jasaweb-developer**: Implements setup following established patterns
- **@jasaweb-security**: Ensures security configuration
- **@jasaweb-tester**: Sets up testing infrastructure

### Background Tasks
- Parallel directory structure creation
- Concurrent configuration file generation
- Simultaneous service and component setup
- Automated validation and compliance checking

## Output
Provides a fully configured JasaWeb project with:
- Complete directory structure
- All necessary configuration files
- Service layer abstractions
- Component architecture
- Testing infrastructure
- Security configuration
- Development tools setup

## Success Metrics
- Project structure follows JasaWeb patterns 100%
- All configuration files are valid and functional
- Service layer implements proper abstractions
- Component architecture follows established patterns
- Testing infrastructure supports comprehensive coverage
- Security configuration meets 100/100 score requirements
- Development tools enable efficient workflow

This skill ensures new JasaWeb projects start with the same worldclass architecture and standards as the main project, enabling consistent development practices across all JasaWeb initiatives.