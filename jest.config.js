module.exports = {
  displayName: 'JasaWeb',
  projects: ['<rootDir>/apps/api/test/jest.config.js'],
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
