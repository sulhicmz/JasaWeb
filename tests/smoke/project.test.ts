import { describe, it, expect } from 'vitest';

describe('Smoke Tests', () => {
  describe('Build Configuration', () => {
    it('should have valid package.json', async () => {
      const pkg = await import('../package.json');
      expect(pkg.name).toBe('jasaweb');
      expect(pkg.version).toBeDefined();
      expect(pkg.scripts).toBeDefined();
    });

    it('should have required dependencies', async () => {
      const pkg = await import('../package.json');
      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.devDependencies.vitest).toBeDefined();
      expect(pkg.devDependencies.typescript).toBeDefined();
    });
  });

  describe('Project Structure', () => {
    it('should have required directories', async () => {
      const fs = await import('fs/promises');
      
      const requiredDirs = [
        'apps/web',
        'apps/api',
        'packages/ui',
        'packages/testing',
        '.github/workflows'
      ];

      for (const dir of requiredDirs) {
        try {
          await fs.access(dir);
          expect(true).toBe(true);
        } catch {
          expect.fail(`Required directory ${dir} does not exist`);
        }
      }
    });

    it('should have required configuration files', async () => {
      const fs = await import('fs/promises');
      
      const requiredFiles = [
        'package.json',
        'pnpm-lock.yaml',
        'tsconfig.json',
        'vitest.config.ts',
        '.github/workflows/ci-cd.yml'
      ];

      for (const file of requiredFiles) {
        try {
          await fs.access(file);
          expect(true).toBe(true);
        } catch {
          expect.fail(`Required file ${file} does not exist`);
        }
      }
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have valid TypeScript config', async () => {
      const fs = await import('fs/promises');
      const config = await fs.readFile('tsconfig.json', 'utf-8');
      expect(config).toContain('"compilerOptions"');
      expect(config).toContain('"target"');
      expect(config).toContain('"module"');
    });
  });

  describe('Environment Setup', () => {
    it('should have correct Node version requirement', async () => {
      const pkg = await import('../package.json');
      expect(pkg.engines.node).toBe('>=20.0.0');
    });

    it('should have pnpm as package manager', async () => {
      const pkg = await import('../package.json');
      expect(pkg.packageManager).toBe('pnpm@8.15.0');
    });
  });
});