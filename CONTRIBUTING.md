# Contributing to JasaWeb

Thank you for your interest in contributing to JasaWeb! This guide will help you get started with contributing to our project.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/JasaWeb.git
   cd jasaweb
   ```
3. **Set up development environment**
   ```bash
   ./scripts/setup.sh
   ```
4. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
5. **Make your changes**
6. **Submit a pull request**

## 📋 Table of Contents

- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## 🔄 Development Workflow

### 1. Before You Start

- Check existing [issues](https://github.com/sulhicmz/JasaWeb/issues) and [pull requests](https://github.com/sulhicmz/JasaWeb/pulls)
- Read our [Code of Conduct](./CODE_OF_CONDUCT.md)
- Join our [Discussions](https://github.com/sulhicmz/JasaWeb/discussions) to ask questions

### 2. Setting Up

```bash
# Clone the repository
git clone https://github.com/your-username/JasaWeb.git
cd jasaweb

# Add upstream remote
git remote add upstream https://github.com/sulhicmz/JasaWeb.git

# Set up development environment
./scripts/setup.sh

# Start development servers
pnpm dev
```

### 3. Making Changes

#### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes
- `chore/description` - Maintenance tasks

#### Commit Message Format
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
```
feat(auth): add two-factor authentication
fix(api): resolve user profile loading issue
docs(readme): update installation instructions
test(auth): add unit tests for login service
```

### 4. Development Process

1. **Create issue** (if not already exists)
2. **Create branch** from `develop`
3. **Make changes** with regular commits
4. **Test thoroughly** (see testing guidelines)
5. **Update documentation** if needed
6. **Submit pull request** to `develop`

## 📝 Code Standards

### TypeScript/JavaScript

#### General Guidelines
- Use TypeScript for all new code
- Follow strict TypeScript settings
- Use meaningful variable and function names
- Keep functions small and focused
- Use ES6+ features when appropriate

#### Code Style
```typescript
// ✅ Good
const getUserById = async (id: string): Promise<User | null> => {
  try {
    return await userRepository.findById(id);
  } catch (error) {
    logger.error('Failed to get user', { id, error });
    throw new Error('User not found');
  }
};

// ❌ Bad
const getUser = async (i) => {
  return await userRepo.find(i);
};
```

#### Error Handling
```typescript
// ✅ Good
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new AppError('Operation failed', 500);
}

// ❌ Bad
try {
  return await someOperation();
} catch (e) {
  return null;
}
```

### React/Astro Components

#### Component Structure
```astro
---
// Imports at the top
import { Card, Button } from '@/components/ui';
import type { User } from '@/types';

// Props interface
interface Props {
  user: User;
  onEdit?: (user: User) => void;
}

// Component logic
const { user, onEdit } = Astro.props;

const handleEdit = () => {
  onEdit?.(user);
};
---

<!-- Template -->
<Card>
  <h2>{user.name}</h2>
  <p>{user.email}</p>
  {onEdit && <Button onClick={handleEdit}>Edit</Button>}
</Card>
```

#### Best Practices
- Use TypeScript interfaces for props
- Keep components focused on single responsibility
- Use semantic HTML elements
- Implement proper accessibility

### API Development (NestJS)

#### Controller Structure
```typescript
@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  async getProjects(): Promise<ProjectResponse[]> {
    return this.projectService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User,
  ): Promise<ProjectResponse> {
    return this.projectService.create(createProjectDto, user);
  }
}
```

#### Service Layer
```typescript
@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly logger: Logger,
  ) {}

  async findAll(): Promise<Project[]> {
    try {
      return await this.projectRepository.findMany();
    } catch (error) {
      this.logger.error('Failed to fetch projects', { error });
      throw new InternalServerErrorException('Failed to fetch projects');
    }
  }
}
```

### Database (Prisma)

#### Model Definitions
```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])
  organizationId String

  @@map('projects')
}
```

#### Query Best Practices
```typescript
// ✅ Good - Use transactions for related operations
async createProjectWithMilestones(data: CreateProjectDto): Promise<Project> {
  return this.prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: data.organizationId,
      },
    });

    if (data.milestones) {
      await tx.milestone.createMany({
        data: data.milestones.map(milestone => ({
          ...milestone,
          projectId: project.id,
        })),
      });
    }

    return project;
  });
}

// ❌ Bad - Multiple separate queries
async createProjectWithMilestones(data: CreateProjectDto): Promise<Project> {
  const project = await this.prisma.project.create({
    data: data,
  });

  for (const milestone of data.milestones) {
    await this.prisma.milestone.create({
      data: { ...milestone, projectId: project.id },
    });
  }

  return project;
}
```

## 🧪 Testing Guidelines

### Test Structure

```
apps/api/src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.service.spec.ts    # Unit tests
├── projects/
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── projects.service.spec.ts
└── test/
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    └── e2e/                   # End-to-end tests
```

### Unit Testing

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const user = { id: '1', email, password: 'hashedPassword' };
      
      userRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'sign').mockReturnValue('token');

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toEqual({ accessToken: 'token' });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(email, password))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### Integration Testing

```typescript
// auth.integration.spec.ts
describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    prisma = module.get(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.cleanDatabase(); // Helper to clean test data
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(user.email);
    });
  });
});
```

### E2E Testing

```typescript
// auth.e2e-spec.ts
describe('Authentication Flow (E2E)', () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close();
  });

  it('should allow user to register and login', async () => {
    // Visit registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="register-button"]');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Login with new account
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Testing Requirements

- **Unit Tests**: All business logic must have unit tests
- **Integration Tests**: All API endpoints must have integration tests
- **E2E Tests**: Critical user workflows must have E2E tests
- **Coverage**: Minimum 80% code coverage
- **Test Data**: Use factories or fixtures for test data

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Creates a new project with the provided data
 * 
 * @param createProjectDto - Project creation data
 * @param user - User creating the project
 * @returns Promise resolving to the created project
 * 
 * @example
 * ```typescript
 * const project = await projectService.create(
 *   { name: 'My Project', description: 'Test project' },
 *   user
 * );
 * ```
 * 
 * @throws {BadRequestException} When project data is invalid
 * @throws {UnauthorizedException} When user lacks permissions
 */
async create(
  createProjectDto: CreateProjectDto,
  user: User,
): Promise<Project> {
  // Implementation
}
```

### API Documentation

- Use Swagger/OpenAPI decorators
- Document all endpoints
- Include examples for complex requests
- Document error responses

### README Updates

- Update README.md for user-facing changes
- Update technical documentation for developers
- Include migration guides for breaking changes

## 🔀 Pull Request Process

### Before Submitting

1. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

2. **Update documentation**
   - README.md if needed
   - API documentation
   - Code comments

3. **Ensure your branch is up to date**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

### Pull Request Template

Use our [PR template](../.github/pull_request_template.md) which includes:

- Type of change
- Description
- Related issues
- Testing checklist
- Additional context

### Review Process

1. **Automated checks** must pass
2. **Code review** by at least one maintainer
3. **Tests** must be added for new functionality
4. **Documentation** must be updated
5. **Approval** required before merge

### Merge Guidelines

- **Squash commits** for clean history
- **Delete feature branches** after merge
- **Update CHANGELOG.md** for significant changes
- **Create release** for breaking changes

## 🐛 Issue Reporting

### Bug Reports

Use our [bug report template](../.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Use our [feature request template](../.github/ISSUE_TEMPLATE/feature_request.yml) and include:

- Problem statement
- Proposed solution
- Alternative approaches
- Acceptance criteria

### Security Issues

🚨 **Do not report security issues publicly!**

- Email: security@jasaweb.com
- Use our [Security Policy](./SECURITY.md)
- We'll respond within 48 hours

## 👥 Community

### Getting Help

- **Discussions**: [GitHub Discussions](https://github.com/sulhicmz/JasaWeb/discussions)
- **Issues**: [GitHub Issues](https://github.com/sulhicmz/JasaWeb/issues)
- **Discord**: [Join our Discord](https://discord.gg/jasaweb)
- **Email**: hello@jasaweb.com

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) and follow it in all interactions.

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights
- Special contributor badges

## 🏆 Recognition Program

### Contributor Levels

- **Contributor**: 1+ merged PRs
- **Active Contributor**: 5+ merged PRs
- **Core Contributor**: 20+ merged PRs
- **Maintainer**: Trusted community member with merge access

### Benefits

- **Contributor**: GitHub contributor badge
- **Active Contributor**: Early access to features
- **Core Contributor**: Special Discord role
- **Maintainer**: Repository access, swag

## 📋 Development Checklist

### Before Committing
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] TypeScript compilation succeeds
- [ ] Documentation updated
- [ ] Self-review completed

### Before Opening PR
- [ ] All tests pass
- [ ] Code reviewed by self
- [ ] PR description filled out
- [ ] Linked to relevant issues
- [ ] Ready for review

### Before Merge
- [ ] All automated checks pass
- [ ] Code review approved
- [ ] Tests added for new features
- [ ] Documentation updated
- [ ] CHANGELOG updated

## 🎯 Ways to Contribute

### Code Contributions
- Bug fixes
- New features
- Performance improvements
- Code refactoring
- Test improvements

### Non-Code Contributions
- Documentation improvements
- Bug reports and triage
- Feature suggestions
- Community support
- Design contributions
- Translation help

### Infrastructure
- CI/CD improvements
- Docker optimizations
- Security enhancements
- Performance monitoring
- DevOps automation

## 📞 Getting Started Help

If you're new to contributing:

1. **Start small** - Fix a typo or simple bug
2. **Ask questions** - Use Discussions for help
3. **Join community** - Connect with other contributors
4. **Read code** - Understand existing patterns
5. **Attend events** - Join our contributor meetings

---

Thank you for contributing to JasaWeb! 🎉

Every contribution, no matter how small, helps make our project better.