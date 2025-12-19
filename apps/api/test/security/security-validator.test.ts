/**
 * Security tests for file operations and path validation
 */

import { describe, it, expect } from 'vitest';
import { SecurityValidator } from '../../src/common/utils/security-validator';

describe('SecurityValidator', () => {
  describe('sanitizeKey', () => {
    it('should allow safe keys', () => {
      expect(SecurityValidator.sanitizeKey('safe-key.txt')).toBe(
        'safe-key.txt'
      );
      expect(SecurityValidator.sanitizeKey('folder/file.pdf')).toBe(
        'folder/file.pdf'
      );
      expect(SecurityValidator.sanitizeKey('user_id_photo.jpg')).toBe(
        'user_id_photo.jpg'
      );
    });

    it('should reject dangerous patterns', () => {
      expect(() =>
        SecurityValidator.sanitizeKey('../../../etc/passwd')
      ).toThrow('Invalid file key detected');
      expect(() => SecurityValidator.sanitizeKey('~/.ssh/id_rsa')).toThrow(
        'Invalid file key detected'
      );
      expect(() => SecurityValidator.sanitizeKey('/absolute/path')).toThrow(
        'Invalid file key detected'
      );
    });

    it('should sanitize dangerous characters', () => {
      expect(SecurityValidator.sanitizeKey('file<script>.txt')).toBe(
        'filescript.txt'
      );
      expect(SecurityValidator.sanitizeKey('file|pipe.txt')).toBe(
        'filepipe.txt'
      );
    });
  });

  describe('isValidKey', () => {
    it('should validate safe keys', () => {
      expect(SecurityValidator.isValidKey('safe-key.txt')).toBe(true);
      expect(SecurityValidator.isValidKey('folder/file.pdf')).toBe(true);
      expect(SecurityValidator.isValidKey('user_123.jpg')).toBe(true);
    });

    it('should reject invalid keys', () => {
      expect(SecurityValidator.isValidKey('../../../etc/passwd')).toBe(false);
      expect(SecurityValidator.isValidKey('~/.ssh/id_rsa')).toBe(false);
      expect(SecurityValidator.isValidKey('/absolute/path')).toBe(false);
      expect(SecurityValidator.isValidKey('file<script>.txt')).toBe(false);
      expect(SecurityValidator.isValidKey('file|pipe.txt')).toBe(false);
    });
  });

  describe('validatePath', () => {
    it('should validate safe paths', () => {
      const basePath = './uploads';
      const safePath = './uploads/user/file.txt';
      expect(() =>
        SecurityValidator.validatePath(basePath, safePath)
      ).not.toThrow();
    });

    it('should reject path traversal attempts', () => {
      const basePath = './uploads';
      const traversalPath = './uploads/../etc/passwd';
      expect(() =>
        SecurityValidator.validatePath(basePath, traversalPath)
      ).toThrow('Path traversal attempt detected');
    });

    it('should reject paths outside base directory', () => {
      const basePath = './uploads';
      const outsidePath = '/etc/passwd';
      expect(() =>
        SecurityValidator.validatePath(basePath, outsidePath)
      ).toThrow('Path traversal attempt detected');
    });
  });

  describe('isAllowedPath', () => {
    it('should allow paths within allowed bases', () => {
      expect(SecurityValidator.isAllowedPath('./uploads')).toBe(true);
      expect(SecurityValidator.isAllowedPath('./uploads/user')).toBe(true);
      expect(SecurityValidator.isAllowedPath('/tmp/uploads')).toBe(true);
      expect(SecurityValidator.isAllowedPath('/tmp')).toBe(true);
    });

    it('should reject paths outside allowed bases', () => {
      expect(SecurityValidator.isAllowedPath('/etc')).toBe(false);
      expect(SecurityValidator.isAllowedPath('/root')).toBe(false);
      expect(SecurityValidator.isAllowedPath('../secret')).toBe(false);
    });
  });

  describe('validateFileExtension', () => {
    it('should allow allowed extensions', () => {
      expect(SecurityValidator.validateFileExtension('document.pdf')).toBe(
        true
      );
      expect(SecurityValidator.validateFileExtension('image.jpg')).toBe(true);
      expect(SecurityValidator.validateFileExtension('data.json')).toBe(true);
      expect(SecurityValidator.validateFileExtension('notes.txt')).toBe(true);
    });

    it('should reject disallowed extensions', () => {
      expect(SecurityValidator.validateFileExtension('malware.exe')).toBe(
        false
      );
      expect(SecurityValidator.validateFileExtension('script.sh')).toBe(false);
      expect(SecurityValidator.validateFileExtension('virus.bat')).toBe(false);
    });
  });

  describe('getLiteralPath', () => {
    it('should return valid literal paths', () => {
      expect(SecurityValidator.getLiteralPath('UPLOAD_DIR')).toBe('./uploads');
      expect(SecurityValidator.getLiteralPath('TEMP_DIR')).toBe('/tmp');
      expect(SecurityValidator.getLiteralPath('SECURITY_REPORTS_DIR')).toBe(
        'security-reports'
      );
      expect(SecurityValidator.getLiteralPath('DEFAULT_FILENAME')).toBe(
        'default.json'
      );
    });
  });

  describe('validateLiteralOperation', () => {
    it('should validate safe literal operations', () => {
      expect(
        SecurityValidator.validateLiteralOperation(
          './uploads/file.txt',
          './uploads'
        )
      ).toBe(true);
      expect(
        SecurityValidator.validateLiteralOperation('/tmp/data.json', '/tmp')
      ).toBe(true);
    });

    it('should reject unsafe operations', () => {
      expect(
        SecurityValidator.validateLiteralOperation(
          './uploads/../etc/passwd',
          './uploads'
        )
      ).toBe(false);
      expect(
        SecurityValidator.validateLiteralOperation(
          '../secret/file.txt',
          './uploads'
        )
      ).toBe(false);
    });
  });

  describe('validateDirectoryPath', () => {
    it('should validate safe directory paths', () => {
      expect(() =>
        SecurityValidator.validateDirectoryPath('./uploads/user', './uploads')
      ).not.toThrow();
    });

    it('should reject dangerous directory paths', () => {
      expect(() =>
        SecurityValidator.validateDirectoryPath('./uploads/../etc', './uploads')
      ).toThrow();
      expect(() =>
        SecurityValidator.validateDirectoryPath(
          './uploads<script>',
          './uploads'
        )
      ).toThrow();
    });
  });
});

describe('LocalStorageAdapter Security', () => {
  describe('File Upload Security', () => {
    it('should validate file paths before upload', () => {
      // Mock test for secure file upload path validation
      const secureKey = 'user/document.pdf';
      const sanitizedKey = SecurityValidator.sanitizeKey(secureKey);
      expect(SecurityValidator.isValidKey(sanitizedKey)).toBe(true);
    });

    it('should reject malicious file paths', () => {
      const maliciousKey = '../../../etc/passwd';
      expect(() => SecurityValidator.sanitizeKey(maliciousKey)).toThrow();
    });
  });

  describe('File Access Security', () => {
    it('should validate file paths before read operations', () => {
      const basePath = './uploads';
      const safePath = './uploads/user/file.txt';
      expect(() =>
        SecurityValidator.validatePath(basePath, safePath)
      ).not.toThrow();
    });

    it('should prevent path traversal in file access', () => {
      const basePath = './uploads';
      const maliciousPath = './uploads/../etc/passwd';
      expect(() =>
        SecurityValidator.validatePath(basePath, maliciousPath)
      ).toThrow();
    });
  });
});

describe('SecurityMonitoring Service Security', () => {
  describe('Report File Security', () => {
    it('should validate report file extensions', () => {
      expect(
        SecurityValidator.validateFileExtension('security-report.json')
      ).toBe(true);
      expect(SecurityValidator.validateFileExtension('malware.exe')).toBe(
        false
      );
    });

    it('should use secure literal paths for report operations', () => {
      const reportsDir = SecurityValidator.getLiteralPath(
        'SECURITY_REPORTS_DIR'
      );
      expect(reportsDir).toBe('security-reports');
    });
  });
});

describe('Integration Security Tests', () => {
  describe('Complete File Operation Flow', () => {
    it('should maintain security throughout file lifecycle', () => {
      // Test key sanitization
      const originalKey = 'user/../secret/file.txt';
      expect(() => SecurityValidator.sanitizeKey(originalKey)).toThrow();

      // Test safe key
      const safeKey = 'user/document.pdf';
      const sanitizedKey = SecurityValidator.sanitizeKey(safeKey);
      expect(SecurityValidator.isValidKey(sanitizedKey)).toBe(true);

      // Test path validation
      const basePath = './uploads';
      const fullPath = `${basePath}/${sanitizedKey}`;
      expect(() =>
        SecurityValidator.validatePath(basePath, fullPath)
      ).not.toThrow();

      // Test extension validation
      expect(SecurityValidator.validateFileExtension(sanitizedKey)).toBe(true);
    });
  });
});
