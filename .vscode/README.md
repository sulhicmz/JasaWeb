# VS Code Configuration Guide

This directory contains standardized VS Code configurations for the JasaWeb development team to ensure a consistent and productive development environment.

## 🚀 Quick Start

1. **Install Recommended Extensions**
   - Open VS Code in this workspace
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Extensions: Show Recommended Extensions"
   - Click "Install" to install all recommended extensions

2. **Workspace Settings**
   - All settings are automatically applied when you open this workspace
   - Key features:
     - Auto-format on save with Prettier
     - Auto-fix ESLint issues on save
     - Consistent indentation (2 spaces)
     - TypeScript auto-imports and organization

## 📁 Configuration Files

### `settings.json`
Configures the workspace behavior and editor settings:
- **Formatting**: Auto-format on save with Prettier
- **Linting**: Auto-fix ESLint issues on save
- **TypeScript**: Enhanced auto-imports and file move handling
- **File Management**: Trim trailing whitespace, consistent line endings
- **Search & Watch**: Excludes build artifacts and dependencies
- **Language Support**: Astro, Tailwind CSS, and Prisma integrations

### `extensions.json`
Defines recommended extensions for optimal development:
- **Core**: TypeScript, ESLint, Prettier, Tailwind CSS
- **NestJS**: Official NestJS extension for API development
- **Astro**: Official Astro extension for web development
- **Database**: Prisma tools for database management
- **Productivity**: GitLens, GitHub integration, spell checker
- **Testing**: Vitest and Playwright support
- **Security**: Dependency and vulnerability scanning

### `launch.json`
Provides debugging configurations:
- **Debug NestJS API**: Debug the backend API server
- **Debug NestJS Tests**: Debug API test suites
- **Debug Astro Web**: Debug the frontend development server
- **Debug Vitest Tests**: Debug unit and integration tests
- **Debug Current TypeScript File**: Quick debugging of any TS file
- **Debug Full Stack**: Debug both API and Web simultaneously

### `tasks.json`
Defines reusable development tasks:
- **Development**: Start dev servers (full stack, API only, web only)
- **Building**: Build applications (all, API only, web only)
- **Testing**: Run test suites (all, API, E2E)
- **Code Quality**: Lint, format, and type checking
- **Database**: Prisma operations (generate, migrate, studio)
- **Security**: Dependency auditing
- **Maintenance**: Clean build artifacts

## 🛠️ How to Use

### Running Tasks
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Tasks: Run Task"
3. Select the desired task from the list
4. Or use the Terminal menu: Terminal → Run Task...

### Debugging
1. Open the file you want to debug
2. Press `F5` or go to Run and Debug panel
3. Select the appropriate debug configuration:
   - Use "Debug NestJS API" for backend development
   - Use "Debug Astro Web" for frontend development
   - Use "Debug Full Stack" to debug both simultaneously

### Recommended Workflow
1. **Start Development**: Run "Start Development (Full Stack)" task
2. **Code Changes**: Edit files with auto-formatting and linting
3. **Debug**: Use F5 with appropriate configuration
4. **Test**: Run "Run All Tests" before committing
5. **Build**: Run "Build All Applications" to verify production build

## 🔧 Customization

### Personal Settings Override
If you need personal settings that differ from the team standards:
1. Create `.vscode/settings.json` in your user home directory
2. Add your personal overrides there
3. Workspace settings will take precedence, but personal settings will override them

### Adding Extensions
To add new recommended extensions for the team:
1. Edit `.vscode/extensions.json`
2. Add the extension ID to the `recommendations` array
3. Commit the change for the team to get the recommendation

### Custom Tasks
To add new development tasks:
1. Edit `.vscode/tasks.json`
2. Add task objects to the `tasks` array
3. Follow the existing naming and grouping conventions

## 🐛 Troubleshooting

### Extensions Not Installing
- Ensure VS Code is version 1.60 or later
- Check that you have internet connectivity
- Try installing extensions manually from the Extensions panel

### Debugging Not Working
- Verify that you have the required dependencies installed (`pnpm install`)
- Check that the programs in `launch.json` exist in your `node_modules`
- Ensure your launch configuration matches your project structure

### Tasks Not Found
- Run `pnpm install` to ensure all dependencies are available
- Check that the scripts exist in `package.json`
- Verify you're in the correct working directory

### TypeScript Errors
- Run "Type Check All" task to verify TypeScript configuration
- Ensure `pnpm install` has been run
- Check that `tsconfig.json` files are properly configured

## 📚 Additional Resources

- [VS Code Documentation](https://code.visualstudio.com/docs)
- [NestJS VS Code Extension](https://marketplace.visualstudio.com/items?itemName=nestjs.nestjs)
- [Astro VS Code Extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
- [Prisma VS Code Extension](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 🤝 Contributing

When making changes to these configurations:
1. Test the changes in a fresh workspace
2. Ensure all tasks and debug configurations work
3. Update this documentation if adding new features
4. Communicate significant changes to the team

These configurations are designed to work with the JasaWeb monorepo structure and should provide a consistent, productive development experience for all team members.