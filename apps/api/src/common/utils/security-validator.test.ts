import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SecurityValidator } from './security-validator';
import fs from 'fs';
import path from 'path';

describe('SecurityValidator', () => {
  const testDir = './test-uploads';

  beforeEach(() => {
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('sanitizeKey', () => {
    it('should sanitize valid keys', () => {
      expect(SecurityValidator.sanitizeKey('valid-file.txt')).toBe(
        'valid-file.txt'
      );
      expect(SecurityValidator.sanitizeKey('dir/file.txt')).toBe(
        'dir/file.txt'
      );
      expect(SecurityValidator.sanitizeKey('file_with_underscores.pdf')).toBe(
        'file_with_underscores.pdf'
      );
    });

    it('should remove invalid characters', () => {
      expect(SecurityValidator.sanitizeKey('file@with#symbols.txt')).toBe(
        'filewithsymbols.txt'
      );
      expect(SecurityValidator.sanitizeKey('file with spaces.txt')).toBe(
        'filewithspaces.txt'
      );
    });

    it('should throw on dangerous patterns', () => {
      expect(() => SecurityValidator.sanitizeKey('../dangerous.txt')).toThrow(
        'Invalid file key detected'
      );
      expect(() => SecurityValidator.sanitizeKey('~config')).toThrow(
        'Invalid file key detected'
      );
      expect(() => SecurityValidator.sanitizeKey('/absolute/path')).toThrow(
        'Invalid file key detected'
      );
    });
  });

  describe('isValidKey', () => {
    it('should validate safe keys', () => {
      expect(SecurityValidator.isValidKey('valid-file.txt')).toBe(true);
      expect(SecurityValidator.isValidKey('dir/subdir/file.txt')).toBe(true);
      expect(SecurityValidator.isValidKey('file_with_123.pdf')).toBe(true);
    });

    it('should reject dangerous keys', () => {
      expect(SecurityValidator.isValidKey('../file.txt')).toBe(false);
      expect(SecurityValidator.isValidKey('~config')).toBe(false);
      expect(SecurityValidator.isValidKey('/absolute/path')).toBe(false);
      expect(SecurityValidator.isValidKey('file<script>.txt')).toBe(false);
      expect(SecurityValidator.isValidKey('file|pipe.txt')).toBe(false);
    });
  });

  describe('validatePath', () => {
    it('should validate safe paths', () => {
      const basePath = path.resolve(testDir);
      const filePath = path.join(testDir, 'file.txt');

      expect(SecurityValidator.validatePath(basePath, filePath)).toBe(
        path.normalize(filePath)
      );
    });

    it('should prevent path traversal attacks', () => {
      const basePath = path.resolve(testDir);
      const dangerousPath = path.join(testDir, '..', 'etc', 'passwd');

      expect(() =>
        SecurityValidator.validatePath(basePath, dangerousPath)
      ).toThrow('Path traversal attempt detected');
    });
  });

  describe('isAllowedPath', () => {
    it('should allow configured base directories', () => {
      expect(SecurityValidator.isAllowedPath('./uploads')).toBe(true);
      expect(SecurityValidator.isAllowedPath('/tmp/uploads')).toBe(true);
      expect(SecurityValidator.isAllowedPath(process.cwd())).toBe(true);
      expect(SecurityValidator.isAllowedPath('/tmp')).toBe(true);
    });

    it('should reject unauthorized paths', () => {
      expect(SecurityValidator.isAllowedPath('/etc')).toBe(false);
      expect(SecurityValidator.isAllowedPath('../../..')).toBe(false);
      expect(SecurityValidator.isAllowedPath('/root')).toBe(false);
    });
  });

  describe('validateDirectoryPath', () => {
    it('should validate safe directory paths', () => {
      const dirPath = path.join(testDir, 'subdir');
      const validatedPath = SecurityValidator.validateDirectoryPath(
        dirPath,
        testDir
      );

      expect(validatedPath).toBe(path.normalize(dirPath));
    });

    it('should reject dangerous directory paths', () => {
      expect(() =>
        SecurityValidator.validateDirectoryPath('/etc', testDir)
      ).toThrow('Path not allowed for directory creation');
      expect(() =>
        SecurityValidator.validateDirectoryPath('..', testDir)
      ).toThrow('Path not allowed for directory creation');
    });

    it('should reject paths with invalid characters', () => {
      const invalidPath = path.join(testDir, 'dir<script>');
      expect(() =>
        SecurityValidator.validateDirectoryPath(invalidPath, testDir)
      ).toThrow('Invalid characters in directory path');
    });
  });

  describe('createSecureFileExists', () => {
    it('should create a secure file existence checker', () => {
      const secureExists = SecurityValidator.createSecureFileExists();

      // Create a test file
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'test');

      expect(secureExists(testFile)).toBe(true);
      expect(secureExists('./nonexistent.txt')).toBe(false);
    });

    it('should reject unauthorized paths', () => {
      const secureExists = SecurityValidator.createSecureFileExists();

      expect(secureExists('/etc/passwd')).toBe(false);
      expect(secureExists('../../secret')).toBe(false);
    });
  });

  describe('createSecureMkdir', () => {
    it('should create a secure directory creator', () => {
      const secureMkdir = SecurityValidator.createSecureMkdir();
      const newDir = path.join(testDir, 'new-subdir');

      secureMkdir(newDir);
      expect(fs.existsSync(newDir)).toBe(true);
      expect(fs.statSync(newDir).mode & 0o777).toBe(0o750);
    });

    it('should reject unauthorized directory creation', () => {
      const secureMkdir = SecurityValidator.createSecureMkdir();

      expect(() => secureMkdir('/etc/unauthorized')).toThrow(
        'Path not allowed for directory creation'
      );
    });
  });
});
