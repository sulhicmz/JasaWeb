# JasaWeb OpenCode Integration

## Overview
This directory contains the complete OpenCode CLI integration for JasaWeb, combining the power of **oh-my-opencode** and **opencode-antigravity-auth** with JasaWeb-specific agents, skills, and commands.

## Integration Components

### 🚀 Plugins Installed
- **oh-my-opencode@latest** - Advanced agent orchestration with multi-model support
- **opencode-antigravity-auth@latest** - Google OAuth authentication for premium models

### 🤖 JasaWeb-Specific Agents
- **@jasaweb-architect** - Architectural compliance (99.8/100 score)
- **@jasaweb-developer** - Development following AGENTS.md rules
- **@jasaweb-security** - Security auditing (100/100 score)
- **@jasaweb-tester** - Comprehensive testing (464 tests baseline)

### 🛠️ Skills & Commands
- **@skill jasaweb-setup** - Automated project initialization
- **@jasaweb-audit** - Comprehensive architectural audit

## Quick Start

### 1. Authentication Setup
```bash
# Set up Google OAuth for premium models
opencode auth login

# Verify authentication
opencode auth list
```

### 2. Test Basic Integration
```bash
# Test with default agent
opencode run "Hello, test the integration"

# Test JasaWeb agents (after auth setup)
opencode run "Review the current architecture" --agent jasaweb-architect
```

### 3. Use JasaWeb Commands
```bash
# Run architectural audit
@jasaweb-audit full --report

# Set up new JasaWeb project
@skill jasaweb-setup
```

## Agent Capabilities

### @jasaweb-architect
- **Model**: Google Antigravity Claude Sonnet 4.5 Thinking
- **Role**: Maintain 99.8/100 architectural score
- **Expertise**: Service layer, security patterns, performance optimization
- **Integration**: Works with Oracle agent for high-level decisions

### @jasaweb-developer
- **Model**: Google Antigravity Gemini 3 Pro
- **Role**: Implement features following AGENTS.md rules
- **Expertise**: API development, component architecture, testing
- **Integration**: Coordinates with Frontend Engineer for UI work

### @jasaweb-security
- **Model**: Google Antigravity Claude Opus 4.5 Thinking
- **Role**: Maintain 100/100 security score
- **Expertise**: Vulnerability assessment, compliance, payment security
- **Integration**: Uses background agents for comprehensive scanning

### @jasaweb-tester
- **Model**: Google Antigravity Gemini 3 Flash
- **Role**: Maintain 464-test baseline with 100% pass rate
- **Expertise**: Unit testing, E2E workflows, performance testing
- **Integration**: Parallel test execution with background agents

## Model Access

### Google Antigravity Models
- **Claude Opus 4.5 Thinking** - High-complexity architectural decisions
- **Claude Sonnet 4.5 Thinking** - Balanced development and analysis
- **Gemini 3 Pro** - Fast development and prototyping
- **Gemini 3 Flash** - Quick testing and documentation

### Model Selection Strategy
- **Architecture**: Claude Opus 4.5 Thinking (max variant)
- **Development**: Gemini 3 Pro or Claude Sonnet 4.5
- **Security**: Claude Opus 4.5 Thinking (low variant)
- **Testing**: Gemini 3 Flash (minimal variant)

## Configuration Files

### `.opencode/opencode.json`
Main configuration with:
- Plugin declarations
- Google provider models
- JasaWeb agent definitions

### `.opencode/oh-my-opencode.json`
Oh-my-opencode specific settings:
- Agent model assignments
- Background task limits
- Category delegations
- Sisyphus configuration

### `.opencode/antigravity.json`
Antigravity authentication settings:
- Account selection strategy
- Rate limiting configuration
- Session recovery options

## Integration Benefits

### 🎯 Enhanced Productivity
- **Parallel Agents**: Multiple agents working simultaneously
- **Background Tasks**: Continuous analysis and testing
- **Context Management**: Efficient context switching
- **Todo Enforcement**: Tasks completed before moving on

### 🔒 Enterprise Security
- **Google OAuth**: Secure authentication with enterprise accounts
- **Multi-Account Support**: Load balancing across accounts
- **Rate Limiting**: Intelligent quota management
- **Session Recovery**: Automatic error recovery

### 🏗️ Architectural Excellence
- **99.8/100 Score**: Maintain worldclass architecture
- **Automated Auditing**: Continuous compliance checking
- **Pattern Enforcement**: Consistent development practices
- **Performance Optimization**: Sub-2ms query targets

### 🧪 Comprehensive Testing
- **464 Test Baseline**: Extensive test coverage
- **E2E Workflows**: Complete business process testing
- **Performance Testing**: Load and optimization testing
- **Security Testing**: Vulnerability assessment

## Usage Patterns

### Development Workflow
```bash
# 1. Architectural planning
@jasaweb-architect Plan the new feature architecture

# 2. Implementation
@jasaweb-developer Implement the feature following AGENTS.md

# 3. Security review
@jasaweb-security Review the implementation for security issues

# 4. Testing
@jasaweb-tester Create comprehensive tests for the feature

# 5. Final audit
@jasaweb-audit full --report
```

### Code Review Process
```bash
# Quick security check
@jasaweb-security Review this PR for vulnerabilities

# Architectural compliance
@jasaweb-architect Validate this follows our patterns

# Test coverage
@jasaweb-tester Ensure adequate test coverage
```

### Project Setup
```bash
# Initialize new JasaWeb project
@skill jasaweb-setup

# Configure development environment
opencode auth login
@jasaweb-audit compliance --fix
```

## Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Reset authentication
rm ~/.config/opencode/antigravity-accounts.json
opencode auth login
```

#### Agent Not Found
```bash
# Check agent availability
opencode agent list

# Verify configuration
cat .opencode/opencode.json
```

#### Plugin Issues
```bash
# Reinstall plugins
npm install -g oh-my-opencode@latest opencode-antigravity-auth@latest

# Check plugin status
opencode --version
```

### Performance Optimization

#### Background Task Limits
Adjust in `.opencode/oh-my-opencode.json`:
```json
{
  "background_tasks": {
    "concurrency_limits": {
      "google": 3,
      "anthropic": 2
    }
  }
}
```

#### Model Selection
Use appropriate models for tasks:
- **Complex Analysis**: Claude Opus 4.5 Thinking
- **Development**: Gemini 3 Pro
- **Quick Tasks**: Gemini 3 Flash
- **Documentation**: Claude Sonnet 4.5

## Integration Verification

### Status Check Commands
```bash
# Verify OpenCode installation
opencode --version

# Check agent availability
opencode agent list

# Verify authentication
opencode auth list

# Test configuration
opencode run "Test integration" --agent jasaweb-architect
```

### Success Indicators
- ✅ All JasaWeb agents appear in `opencode agent list`
- ✅ Google authentication configured
- ✅ Oh-my-opencode features active (background tasks, LSP tools)
- ✅ Antigravity models accessible
- ✅ JasaWeb commands and skills functional

## Next Steps

1. **Complete Authentication**: Set up Google OAuth for full model access
2. **Test Workflows**: Verify agent coordination and task delegation
3. **Customize Configuration**: Adjust models and limits based on usage
4. **Team Training**: Document usage patterns for team members
5. **Monitor Performance**: Track usage and optimize as needed

This integration provides JasaWeb with enterprise-grade AI development capabilities while maintaining the project's worldclass architectural standards and security posture.