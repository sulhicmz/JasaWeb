module.exports = {
  displayName: 'JasaWeb',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  collectCoverageFrom: [
    'apps/**/src/**/*.ts',
    'packages/**/src/**/*.ts',
    '!apps/**/*.dto.ts',
    '!apps/**/*.entity.ts',
    '!apps/**/*.interface.ts',
    '!apps/**/main.ts',
    '!**/*.config.*',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  projects: [
    {
      displayName: 'API',
      testMatch: ['<rootDir>/apps/api/**/*.(test|spec).ts'],
      setupFilesAfterEnv: ['<rootDir>/apps/api/test/jest.config.js'],
    },
  ],
};
