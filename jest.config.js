module.exports = {
  displayName: 'JasaWeb Monorepo',
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
  testTimeout: 10000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  roots: ['<rootDir>/apps/api/src'],
};
