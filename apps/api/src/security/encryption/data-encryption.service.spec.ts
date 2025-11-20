import { Test, TestingModule } from '@nestjs/testing';
import { DataEncryptionService } from '../encryption/data-encryption.service';

describe('DataEncryptionService', () => {
  let service: DataEncryptionService;

  beforeEach(async () => {
    // Mock environment variable for testing
    process.env.ENCRYPTION_KEY =
      'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

    const module: TestingModule = await Test.createTestingModule({
      providers: [DataEncryptionService],
    }).compile();

    service = module.get<DataEncryptionService>(DataEncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt data correctly', async () => {
    const plaintext = 'This is sensitive data';

    const encrypted = await service.encrypt(plaintext);
    expect(encrypted).toHaveProperty('encrypted');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('tag');

    const decrypted = await service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt fields correctly', async () => {
    const fieldData = 'user@example.com';

    const encryptedField = await service.encryptField(fieldData);
    expect(typeof encryptedField).toBe('string');

    const decryptedField = await service.decryptField(encryptedField);
    expect(decryptedField).toBe(fieldData);
  });

  it('should handle PII encryption with metadata', async () => {
    const piiData = 'John Doe';
    const dataType = 'name';
    const userId = 'user123';

    const encryptedPii = await service.encryptPii(piiData, dataType, userId);
    expect(encryptedPii).toHaveProperty('encrypted');
    expect(encryptedPii).toHaveProperty('metadata');

    expect(encryptedPii.metadata.dataType).toBe(dataType);
    expect(encryptedPii.metadata.userId).toBe(userId);
    expect(encryptedPii.metadata.encryptedAt).toBeDefined();

    const decryptedPii = await service.decryptPii(encryptedPii);
    expect(decryptedPii).toBe(piiData);
  });

  it('should generate consistent hashes', async () => {
    const data = 'test data';

    const hash1 = await service.generateHash(data);
    const hash2 = await service.generateHash(data);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
  });

  it('should verify data integrity', async () => {
    const data = 'important data';
    const hash = await service.generateHash(data);

    const isValid = await service.verifyIntegrity(data, hash);
    expect(isValid).toBe(true);

    const isInvalid = await service.verifyIntegrity('modified data', hash);
    expect(isInvalid).toBe(false);
  });

  it('should mask sensitive data correctly', () => {
    const testData = 'user@example.com';
    const masked = service.maskSensitiveData(testData, 4);

    expect(masked).toBe('user***********************');
  });

  it('should detect encrypted data', () => {
    const plaintext = 'not encrypted';
    const encryptedData = JSON.stringify({
      encrypted: 'abc123',
      iv: 'def456',
      tag: 'ghi789',
    });

    expect(service.isEncrypted(plaintext)).toBe(false);
    expect(service.isEncrypted(encryptedData)).toBe(true);
  });

  it('should return algorithm info', () => {
    const info = service.getAlgorithmInfo();

    expect(info).toHaveProperty('algorithm');
    expect(info).toHaveProperty('keyLength');
    expect(info).toHaveProperty('ivLength');

    expect(info.algorithm).toBe('aes-256-gcm');
    expect(info.keyLength).toBe(32);
    expect(info.ivLength).toBe(16);
  });

  it('should handle decryption errors gracefully', async () => {
    const invalidEncryptedData = {
      data: 'invalid',
      iv: 'invalid',
      tag: 'invalid',
    };

    await expect(service.decrypt(invalidEncryptedData)).rejects.toThrow(
      'Data decryption failed'
    );
  });
});
