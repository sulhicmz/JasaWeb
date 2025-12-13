/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Roots of the source files
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        isolatedModules: true,
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Module name mapping for absolute imports and monorepo packages
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@jasaweb/config/(.*)$': '<rootDir>/../../packages/config/$1',
    '^@jasaweb/ui/(.*)$': '<rootDir>/../../packages/ui/$1',
    '^@jasaweb/testing/(.*)$': '<rootDir>/../../packages/testing/$1',
  },

  // Transform ignore patterns (needed for UUID and other ESM modules)
  transformIgnorePatterns: ['node_modules/(?!(uuid|@nestjs/.*|.*\\.mjs$))'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000,
};
