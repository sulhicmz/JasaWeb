# Code Quality Tools Setup

This document outlines the code quality tools and processes configured for the JasaWeb monorepo.

## 🛠️ Tools Configured

### ESLint

- **Configuration**: Modern flat config (`eslint.config.js`)
- **Features**:
  - TypeScript support with strict rules
  - Security rules via `eslint-plugin-security`
  - Import sorting and organization
  - Node.js environment globals
- **Usage**: `npm run lint` / `npm run lint:fix`

### Prettier

- **Configuration**: `.prettierrc.js`
- **Features**: Consistent code formatting
- **Usage**: `npm run format` / `npm run format:check`

### Husky & lint-staged

- **Pre-commit hook**: Runs ESLint and Prettier on staged files
- **Pre-push hook**: Runs test suite
- **Commit message hook**: Enforces conventional commit format
- **Configuration**: `package.json` > `lint-staged`

### Commitlint

- **Configuration**: Conventional commits
- **Purpose**: Standardized commit message format
- **Usage**: Enforced automatically on commit

## 🚀 Usage

### Development Workflow

1. Make your changes
2. Stage files: `git add .`
3. Commit: `git commit -m "feat: add new feature"`
4. Push: `git push`

The pre-commit hooks will automatically:

- Run ESLint with auto-fix
- Format code with Prettier
- Validate commit message format

### Manual Commands

```bash
# Lint all files
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format

# Run tests
npm run test
```

## 📋 Configuration Files

- `eslint.config.js` - ESLint configuration
- `.prettierrc.js` - Prettier configuration
- `.prettierignore` - Files to exclude from Prettier
- `commitlint.config.js` - Commit message validation
- `.husky/` - Git hooks directory
- `package.json` - Scripts and lint-staged config

## 🎯 Quality Standards

### ESLint Rules

- No unused variables (unless prefixed with `_`)
- No explicit `any` types (warnings only)
- Proper import organization
- Security best practices
- Consistent code style

### Prettier Rules

- 2-space indentation
- Single quotes
- Trailing commas (ES5)
- 80 character line width
- Semicolons required

### Commit Messages

Follow conventional commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

## 🔧 Troubleshooting

### Pre-commit hooks fail

1. Check the error messages
2. Run `npm run lint:fix` to auto-fix issues
3. Run `npm run format` to fix formatting
4. Commit again

### Commit message rejected

Ensure your commit message follows the conventional format:

```
type(scope): description

[optional body]

[optional footer]
```

### ESLint errors

- Fix manually or run `npm run lint:fix`
- For intentional violations, use ESLint disable comments
- Update configuration if needed

## 📈 Benefits

- **Consistent Code Style**: Automatic formatting across the team
- **Quality Enforcement**: Catches issues before commit
- **Reduced Review Time**: Less focus on style, more on logic
- **Automated Process**: No manual quality checks needed
- **Team Collaboration**: Standardized development workflow

This setup ensures high code quality and consistent development practices across the entire JasaWeb monorepo.
