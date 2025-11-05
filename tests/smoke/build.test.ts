import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';

describe('Build Smoke Tests', () => {
  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  it('should install dependencies without errors', () => {
    expect(() => {
      execSync('pnpm install --frozen-lockfile', { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should pass type checking', () => {
    expect(() => {
      execSync('pnpm typecheck', { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should pass linting', () => {
    expect(() => {
      execSync('pnpm lint', { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should build web application', () => {
    expect(() => {
      execSync('cd apps/web && pnpm build', { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should build API application', () => {
    expect(() => {
      execSync('cd apps/api && pnpm build', { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should generate Prisma client', () => {
    expect(() => {
      execSync('cd apps/api && pnpm prisma generate', { stdio: 'pipe' });
    }).not.toThrow();
  });
});