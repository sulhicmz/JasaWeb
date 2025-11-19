module.exports = {
  displayName: 'JasaWeb',
  projects: ['<rootDir>/apps/api/test/jest.config.js'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  // Remove coverageReporters from root config as it's not supported
};
