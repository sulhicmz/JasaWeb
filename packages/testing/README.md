# JasaWeb Testing Package

This package provides shared testing utilities and configurations for the JasaWeb monorepo.

## Contents

- **Vitest Configurations**: Standardized Vitest configurations for all packages
- **NestJS Test Utilities**: Helper functions for testing NestJS applications
- **Test Data Factories**: Common test data generators for users, organizations, etc.
- **Test Module Builders**: Utilities for creating consistent test modules

## Usage

### Vitest Configurations

```typescript
// Import standard Vitest configurations
import {
  baseVitestConfig,
  apiVitestConfig,
  webVitestConfig,
  packageVitestConfig,
} from '@jasaweb/testing';

// Use in vitest.config.ts
import { defineConfig } from 'vitest/config';
import { apiVitestConfig } from '@jasaweb/testing';

export default defineConfig(apiVitestConfig);
```

### NestJS Test Utilities

```typescript
import { createTestApp, createTestingModule } from '@jasaweb/testing';
import { Test, TestingModule } from '@nestjs/testing';

// Create a test application
const module: TestingModule = await createTestingModule([
  AppModule,
  // other imports
]);
const app = await createTestApp(module);
```

### Test Data Factories

```typescript
import { TestUtils } from '@jasaweb/testing';

// Generate test data
const testUser = TestUtils.createTestUser({
  email: 'custom@example.com',
});

const testOrg = TestUtils.createTestOrganization({
  name: 'Custom Org Name',
});
```

## Available Configurations

- **baseVitestConfig**: Base configuration for all Vitest setups
- **apiVitestConfig**: Configuration specific to API testing
- **webVitestConfig**: Configuration for frontend web testing
- **packageVitestConfig**: Configuration for shared packages

## Test Utilities

### Functions

- `createTestApp(module)`: Creates a configured NestJS test application
- `createTestingModule(imports, providers)`: Creates a testing module with common setup
- `TestUtils.createTestUser(overrides)`: Generates test user data
- `TestUtils.createTestOrganization(overrides)`: Generates test organization data

## Development

This package follows the monorepo conventions and exports utilities that are used across all packages in JasaWeb.
