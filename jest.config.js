module.exports = {
  displayName: 'JasaWeb',
  projects: [
    {
      displayName: 'API',
      testMatch: ['<rootDir>/apps/api/src/**/?(*.)+(spec|test).ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      collectCoverageFrom: [
        'apps/api/src/**/*.ts',
        '!apps/api/src/**/*.dto.ts',
        '!apps/api/src/**/*.entity.ts',
        '!apps/api/src/**/*.interface.ts',
        '!apps/api/src/main.ts',
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html'],
      testEnvironment: 'node',
      testTimeout: 10000,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'Web',
      testMatch: ['<rootDir>/apps/web/**/?(*.)+(spec|test).ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      collectCoverageFrom: [
        'apps/web/src/**/*.{ts,tsx}',
        '!apps/web/src/**/*.d.ts',
        '!apps/web/src/**/*.stories.{ts,tsx}',
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],
  collectCoverageFrom: [
    'apps/*/src/**/*.{ts,tsx}',
    '!apps/*/src/**/*.d.ts',
    '!apps/*/src/**/*.dto.ts',
    '!apps/*/src/**/*.entity.ts',
    '!apps/*/src/**/*.interface.ts',
    '!apps/*/src/**/*.stories.{ts,tsx}',
    '!apps/*/src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
