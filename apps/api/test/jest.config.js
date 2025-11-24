module.exports = {
  displayName: 'API',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../src'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  collectCoverageFrom: [
    '../src/**/*.ts',
    '!../src/**/*.dto.ts',
    '!../src/**/*.entity.ts',
    '!../src/**/*.interface.ts',
    '!../src/main.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
};
