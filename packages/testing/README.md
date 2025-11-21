# @jasaweb/testing

Shared testing utilities and configurations for the JasaWeb monorepo.

## Installation

```bash
pnpm add @jasaweb/testing --dev
```

## Usage

### Test Helpers

```typescript
import { testHelpers } from '@jasaweb/testing';

// Create mock data
const user = testHelpers.createMockUser({ email: 'custom@example.com' });
const project = testHelpers.createMockProject({ status: 'completed' });

// Wait for async operations
await testHelpers.wait(500);
```

### Database Helpers

```typescript
import { dbHelpers } from '@jasaweb/testing';

// Clean up test database
await dbHelpers.cleanup();

// Seed test data
await dbHelpers.seed({ users: [mockUser] });
```

### Custom Matchers

```typescript
import { matchers } from '@jasaweb/testing';

// Check object structure
const isValid = matchers.hasRequiredFields(obj, ['id', 'name', 'email']);

// Check API response
const isApiValid = matchers.isValidApiResponse(response);
```

## Configuration

This package includes a pre-configured Vitest setup that can be extended in your application:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import testingConfig from '@jasaweb/testing/vitest.config';

export default defineConfig({
  ...testingConfig,
  test: {
    ...testingConfig.test,
    include: ['src/**/*.test.ts'],
  },
});
```

## Features

- 🧪 Mock data generators for common entities
- 🗄️ Database testing utilities
- ✅ Custom test matchers
- 📊 Pre-configured coverage reporting
- 🔧 Shared Vitest configuration
