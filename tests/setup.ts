// vitest setup file
import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Setup code before all tests run
  console.log('Setting up tests...');
});

afterAll(async () => {
  // Cleanup code after all tests run
  console.log('Cleaning up after tests...');
});