# JasaWeb Development Tools Documentation

## Overview

The JasaWeb project includes a comprehensive suite of development tools designed to improve developer productivity, code quality, and workflow efficiency. These tools are located in the `scripts/dev-tools/` directory and provide intelligent automation for common development tasks.

## Table of Contents

- [Development Watcher](#development-watcher-watch-and-reloadsh)
- [Database Tools](#database-tools-database-toolssh)
- [Code Quality Tools](#code-quality-tools-code-qualitysh)
- [Installation and Setup](#installation-and-setup)
- [Integration with package.json](#integration-with-packagejson)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Development Watcher (`watch-and-reload.sh`)

### Purpose

Intelligent file watching and automatic reloading for development servers with performance monitoring and optimized rebuild strategies.

### Features

- **Selective Watching**: Watch API, Web, or both applications independently
- **Performance Monitoring**: Track rebuild times and optimize development workflow
- **Configurable Delays**: Adjustable debounce delays to prevent excessive rebuilds
- **Verbose Output**: Detailed logging for debugging and optimization
- **Cross-platform Compatibility**: Works on macOS, Linux, and Windows (WSL)

### Usage

```bash
# Basic usage
./scripts/dev-tools/watch-and-reload.sh [TARGET]

# With options
./scripts/dev-tools/watch-and-reload.sh [OPTIONS] <TARGET>

# Examples
./scripts/dev-tools/watch-and-reload.sh api                    # Watch API only
./scripts/dev-tools/watch-and-reload.sh --verbose all          # Watch all with verbose output
./scripts/dev-tools/watch-and-reload.sh --performance web      # Watch web with performance monitoring
./scripts/dev-tools/watch-and-reload.sh --delay 2 all          # Watch all with 2s delay
```

### Targets

- `api` - Watch API changes only
- `web` - Watch Web changes only
- `all` - Watch both API and Web changes (default)

### Options

- `--verbose, -v` - Enable verbose output
- `--quiet, -q` - Suppress non-error output
- `--performance, -p` - Enable performance monitoring
- `--delay, -d N` - Set debounce delay in seconds (default: 1)
- `--help, -h` - Show help message

### Performance Features

When `--performance` is enabled, the script tracks:

- Rebuild times for each service
- Number of rebuilds per session
- Average rebuild duration
- Performance trends over time

### Prerequisites

- Node.js 20+ and pnpm installed
- nodemon installed globally or locally
- Project dependencies installed (`pnpm install`)

### Troubleshooting

- **nodemon not found**: Run `npm install -g nodemon`
- **Permission issues**: Run `chmod +x scripts/dev-tools/watch-and-reload.sh`
- **Build failures**: Ensure dependencies are up to date with `pnpm update`

---

## Database Tools (`database-tools.sh`)

### Purpose

Comprehensive database management utilities supporting multiple environments, backup/restore, migrations, and advanced operations.

### Features

- **Multi-Environment Support**: Switch between dev, test, and production environments
- **Backup & Restore**: Automated database backups with timestamping
- **Migration Management**: Create, apply, and rollback migrations safely
- **Schema Validation**: Ensure database schema integrity
- **Environment Switching**: Easy environment configuration management

### Usage

```bash
# Basic usage
./scripts/dev-tools/database-tools.sh <COMMAND> [ARGS]

# With options
./scripts/dev-tools/database-tools.sh [OPTIONS] <COMMAND> [ARGS]

# Examples
./scripts/dev-tools/database-tools.sh reset                    # Reset database
./scripts/dev-tools/database-tools.sh migrate add_user_table   # Create migration
./scripts/dev-tools/database-tools.sh --env test backup        # Backup test environment
./scripts/dev-tools/database-tools.sh restore backup_20231201.sql  # Restore backup
./scripts/dev-tools/database-tools.sh down 2                  # Rollback 2 migrations
```

### Commands

#### Database Operations

- `reset` - Reset database (WARNING: deletes all data)
- `migrate <name>` - Create new migration with specified name
- `up` - Apply pending migrations
- `down [n]` - Rollback last n migrations (default: 1)
- `seed` - Seed database with initial data

#### Utility Commands

- `studio` - Open Prisma Studio
- `generate` - Generate Prisma client
- `status` - Show migration status
- `validate` - Validate database schema

#### Backup & Restore

- `backup [name]` - Create database backup
- `restore <file>` - Restore database from backup file

#### Environment Management

- `env <name>` - Switch to different environment (dev, test, prod)

### Options

- `--force, -f` - Skip confirmation prompts
- `--verbose, -v` - Enable verbose output
- `--env, -e <name>` - Specify environment (dev, test, prod)
- `--help, -h` - Show help message

### Environments

- **dev** - Development environment (default)
- **test** - Testing environment
- **prod** - Production environment (use with caution)

### Backup System

The backup system automatically:

- Creates timestamped backup files
- Stores backups in `backups/` directory
- Compresses large databases
- Maintains backup history
- Validates backup integrity

### Prerequisites

- PostgreSQL installed and running
- pnpm and project dependencies installed
- Database configured in `.env` files
- Sufficient permissions for database operations

### Safety Features

- **Confirmation Prompts**: Destructive operations require confirmation
- **Automatic Backups**: Production operations trigger automatic backups
- **Environment Validation**: Checks database connectivity before operations
- **Rollback Protection**: Validates rollback feasibility before execution

---

## Code Quality Tools (`code-quality.sh`)

### Purpose

Comprehensive code quality management with advanced analysis, performance profiling, security scanning, and automated fixing capabilities.

### Features

- **Multi-Tool Integration**: ESLint, TypeScript, tests, security scanning
- **Performance Analysis**: Code complexity and coverage analysis
- **Automated Fixing**: Auto-fix common code issues
- **Report Generation**: Generate quality reports in multiple formats
- **CI/CD Integration**: Optimized for continuous integration

### Usage

```bash
# Basic usage
./scripts/dev-tools/code-quality.sh <COMMAND> [ARGS]

# With options
./scripts/dev-tools/code-quality.sh [OPTIONS] <COMMAND> [ARGS]

# Examples
./scripts/dev-tools/code-quality.sh all                      # Run all checks
./scripts/dev-tools/code-quality.sh --fix lint              # Fix linting issues
./scripts/dev-tools/code-quality.sh --verbose --output report.md report  # Generate report
./scripts/dev-tools/code-quality.sh --strict pre-commit     # Strict pre-commit checks
./scripts/dev-tools/code-quality.sh dependencies            # Analyze dependencies
```

### Commands

#### Comprehensive Checks

- `all` - Run all code quality checks
- `report` - Generate comprehensive quality report
- `benchmark` - Benchmark code quality metrics

#### Specific Checks

- `check <type>` - Run specific check type
- `profile` - Analyze code performance and complexity
- `dependencies` - Analyze dependency health and updates
- `security` - Run comprehensive security analysis

#### Automated Fixing

- `fix` - Fix code issues automatically

#### CI/CD Integration

- `pre-commit` - Run pre-commit quality checks
- `ci` - Run CI-optimized quality checks

### Check Types

- `lint` - ESLint code linting
- `types` - TypeScript type checking
- `test` - Unit and integration tests
- `security` - Security vulnerability scanning
- `format` - Code formatting validation
- `complexity` - Code complexity analysis
- `coverage` - Test coverage analysis
- `dependencies` - Dependency health analysis
- `duplicates` - Code duplication detection

### Options

- `--fix, -f` - Automatically fix issues when possible
- `--verbose, -v` - Enable detailed output
- `--quiet, -q` - Suppress non-error output
- `--strict, -s` - Use strict mode (fail on warnings)
- `--output, -o <file>` - Save report to file
- `--format, -F <fmt>` - Report format (text, json, markdown)
- `--help, -h` - Show help message

### Report Formats

- **Text**: Plain text format for console output
- **JSON**: Structured data for programmatic processing
- **Markdown**: Formatted documentation for reports

### Quality Metrics

The tool tracks:

- Number of issues by category
- Test coverage percentages
- Code complexity metrics
- Security vulnerability counts
- Dependency health status
- Performance benchmarks

### Prerequisites

- Node.js 20+ and pnpm installed
- All project dependencies installed
- Optional: sonar-scanner for advanced analysis
- Optional: cloc for code metrics

### CI/CD Integration

#### Pre-commit Hook

```bash
#!/bin/sh
./scripts/dev-tools/code-quality.sh pre-commit
```

#### GitHub Actions

```yaml
- name: Run Code Quality Checks
  run: ./scripts/dev-tools/code-quality.sh ci
```

---

## Installation and Setup

### 1. Make Scripts Executable

```bash
chmod +x scripts/dev-tools/*.sh
```

### 2. Install Dependencies

```bash
# Install project dependencies
pnpm install

# Install global tools (optional)
npm install -g nodemon
```

### 3. Configure Environment

```bash
# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit environment files with your configuration
```

### 4. Verify Installation

```bash
# Test each tool
./scripts/dev-tools/watch-and-reload.sh --help
./scripts/dev-tools/database-tools.sh --help
./scripts/dev-tools/code-quality.sh --help
```

---

## Integration with package.json

The development tools are integrated into the project's npm scripts:

```json
{
  "scripts": {
    "dev-tools:watch": "./scripts/dev-tools/watch-and-reload.sh all",
    "dev-tools:db": "./scripts/dev-tools/database-tools.sh",
    "dev-tools:quality": "./scripts/dev-tools/code-quality.sh all"
  }
}
```

### Usage via npm scripts

```bash
# Run watcher
pnpm dev-tools:watch

# Run database tools
pnpm dev-tools:db reset
pnpm dev-tools:db migrate add_table

# Run quality checks
pnpm dev-tools:quality
```

---

## Best Practices

### Development Workflow

1. **Start Development**: Use `watch-and-reload.sh` for automatic reloading
2. **Database Changes**: Use `database-tools.sh` for schema changes
3. **Quality Checks**: Run `code-quality.sh` before committing
4. **Pre-commit**: Use `code-quality.sh pre-commit` in git hooks

### Environment Management

1. **Development**: Use default environment for daily development
2. **Testing**: Switch to test environment for automated testing
3. **Production**: Use production environment only when necessary

### Backup Strategy

1. **Before Major Changes**: Create database backups
2. **Regular Schedule**: Set up automated backups
3. **Environment Isolation**: Keep backups separate by environment

### Code Quality

1. **Early Detection**: Run quality checks frequently
2. **Automated Fixing**: Use `--fix` option for common issues
3. **Strict Mode**: Use `--strict` for CI/CD pipelines
4. **Reporting**: Generate reports for team reviews

---

## Troubleshooting

### Common Issues

#### Permission Denied

```bash
chmod +x scripts/dev-tools/*.sh
```

#### nodemon Not Found

```bash
npm install -g nodemon
# or
pnpm add -D nodemon
```

#### Database Connection Issues

1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env` files
3. Ensure database user has required permissions

#### TypeScript Compilation Errors

1. Run `pnpm install` to update dependencies
2. Check `tsconfig.json` configuration
3. Verify all imports are correct

#### Test Failures

1. Check test configuration files
2. Verify test database is set up
3. Run tests individually for detailed errors

### Debug Mode

Enable verbose output for debugging:

```bash
./scripts/dev-tools/watch-and-reload.sh --verbose all
./scripts/dev-tools/database-tools.sh --verbose status
./scripts/dev-tools/code-quality.sh --verbose check lint
```

### Log Files

Check log files for detailed error information:

- Application logs: `apps/api/logs/`
- Database logs: PostgreSQL logs
- Build logs: Console output with `--verbose`

### Getting Help

Each script includes comprehensive help:

```bash
./scripts/dev-tools/watch-and-reload.sh --help
./scripts/dev-tools/database-tools.sh --help
./scripts/dev-tools/code-quality.sh --help
```

---

## Contributing

When contributing to the development tools:

1. **Test Changes**: Verify changes work across all environments
2. **Update Documentation**: Keep this documentation current
3. **Maintain Compatibility**: Ensure backward compatibility
4. **Add Tests**: Include tests for new functionality
5. **Follow Conventions**: Use existing code style and patterns

---

## License

These development tools are part of the JasaWeb project and follow the same license terms.
