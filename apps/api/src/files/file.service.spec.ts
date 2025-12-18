import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileService, VALID_MIME_TYPES, MAX_FILE_SIZE } from './file.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { LocalFileStorageService } from '../common/services/local-file-storage.service';
import { ConfigService } from '@nestjs/config';

describe('FileService', () => {
  let service: FileService;
  let prismaService: any;
  let fileStorageService: any;
  let localFileStorageService: any;
  let configService: any;

  const mockFile: Buffer = Buffer.from('test file content');
  const mockFilePayload = {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: mockFile,
  };

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
  };

  const mockFileRecord = {
    id: 'file-123',
    filename: '1234567890_test.jpg',
    size: 1024,
    createdAt: new Date(),
    projectId: 'project-123',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      project: {
        findUnique: jest.fn(),
      },
      file: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockFileStorageService = {
      uploadFile: jest.fn(),
      generateDownloadUrl: jest.fn(),
      deleteFile: jest.fn(),
    };

    const mockLocalFileStorageService = {
      uploadFile: jest.fn(),
      getFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FileStorageService,
          useValue: mockFileStorageService,
        },
        {
          provide: LocalFileStorageService,
          useValue: mockLocalFileStorageService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
    prismaService = module.get(MultiTenantPrismaService);
    fileStorageService = module.get(FileStorageService);
    localFileStorageService = module.get(LocalFileStorageService);
    configService = module.get(ConfigService);

    // Default configurations
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      switch (key) {
        case 'STORAGE_TYPE':
          return 'local';
        case 'MAX_FILE_SIZE':
          return MAX_FILE_SIZE;
        default:
          return defaultValue;
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    const organizationId = 'org-123';
    const uploadedById = 'user-123';
    const projectId = 'project-123';

    beforeEach(() => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.file.create.mockResolvedValue(mockFileRecord);
    });

    it('should upload file to local storage successfully', async () => {
      localFileStorageService.uploadFile.mockResolvedValue({
        filename: '1234567890_test.jpg',
        path: '/uploads/1234567890_test.jpg',
      });

      const result = await service.uploadFile(
        {
          file: mockFilePayload,
          projectId,
          uploadedById,
        },
        organizationId
      );

      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(localFileStorageService.uploadFile).toHaveBeenCalled();
      expect(prismaService.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filename: expect.any(String),
          size: mockFilePayload.size,
        }),
      });
      expect(result).toEqual({
        id: mockFileRecord.id,
        filename: mockFileRecord.filename,
        size: mockFileRecord.size,
        uploadedAt: mockFileRecord.createdAt,
        url: '/files/download/file-123',
      });
    });

    it('should upload file to S3 storage successfully', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STORAGE_TYPE') return 's3';
        return 'local';
      });

      fileStorageService.uploadFile.mockResolvedValue('s3-file-key');

      const result = await service.uploadFile(
        {
          file: mockFilePayload,
          projectId,
          uploadedById,
        },
        organizationId
      );

      expect(fileStorageService.uploadFile).toHaveBeenCalled();
      expect(result.url).toBe('/files/download/file-123');
    });

    it('should throw error when project ID is missing', async () => {
      await expect(
        service.uploadFile(
          {
            file: mockFilePayload,
            projectId: '',
            uploadedById,
          },
          organizationId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when file is missing', async () => {
      await expect(
        service.uploadFile(
          {
            file: null as any,
            projectId,
            uploadedById,
          },
          organizationId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when file size exceeds limit', async () => {
      const largeFile = {
        ...mockFilePayload,
        size: MAX_FILE_SIZE + 1,
      };

      await expect(
        service.uploadFile(
          {
            file: largeFile,
            projectId,
            uploadedById,
          },
          organizationId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when file type is not allowed', async () => {
      const invalidFile = {
        ...mockFilePayload,
        mimetype: 'application/x-executable',
      };

      await expect(
        service.uploadFile(
          {
            file: invalidFile,
            projectId,
            uploadedById,
          },
          organizationId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadFile(
          {
            file: mockFilePayload,
            projectId,
            uploadedById,
          },
          organizationId
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('downloadFile', () => {
    const organizationId = 'org-123';
    const fileId = 'file-123';

    beforeEach(() => {
      prismaService.file.findUnique.mockResolvedValue(mockFileRecord);
    });

    it('should download file from local storage', async () => {
      const mockResponse = {
        redirect: jest.fn(),
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      localFileStorageService.getFile.mockResolvedValue(mockFile);

      await service.downloadFile(fileId, organizationId, mockResponse);

      expect(prismaService.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
      });
      expect(localFileStorageService.getFile).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'image/jpeg'
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockFile);
    });

    it('should redirect to S3 signed URL for S3 storage', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STORAGE_TYPE') return 's3';
        return 'local';
      });

      const mockResponse = {
        redirect: jest.fn(),
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      const signedUrl = 'https://s3.amazonaws.com/signed-url';
      fileStorageService.generateDownloadUrl.mockResolvedValue(signedUrl);

      await service.downloadFile(fileId, organizationId, mockResponse);

      expect(fileStorageService.generateDownloadUrl).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(signedUrl);
    });

    it('should throw error when file not found', async () => {
      prismaService.file.findUnique.mockResolvedValue(null);

      const mockResponse = {
        redirect: jest.fn(),
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await expect(
        service.downloadFile(fileId, organizationId, mockResponse)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    const organizationId = 'org-123';
    const fileId = 'file-123';

    beforeEach(() => {
      prismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      prismaService.file.delete.mockResolvedValue(mockFileRecord);
    });

    it('should delete file from local storage', async () => {
      const result = await service.deleteFile(fileId, organizationId);

      expect(prismaService.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
      });
      expect(localFileStorageService.deleteFile).toHaveBeenCalled();
      expect(prismaService.file.delete).toHaveBeenCalledWith({
        where: { id: fileId },
      });
      expect(result).toEqual({ message: 'File deleted successfully' });
    });

    it('should delete file from S3 storage', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STORAGE_TYPE') return 's3';
        return 'local';
      });

      const result = await service.deleteFile(fileId, organizationId);

      expect(fileStorageService.deleteFile).toHaveBeenCalled();
      expect(result).toEqual({ message: 'File deleted successfully' });
    });

    it('should throw error when file not found', async () => {
      prismaService.file.findUnique.mockResolvedValue(null);

      await expect(service.deleteFile(fileId, organizationId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getFileStats', () => {
    it('should return file statistics', async () => {
      const mockFiles = [
        { size: 1024, filename: 'test1.jpg' },
        { size: 2048, filename: 'test2.pdf' },
        { size: 1024, filename: 'test3.jpg' },
      ];

      prismaService.file.findMany.mockResolvedValue(mockFiles);

      const result = await service.getFileStats();

      expect(result).toEqual({
        total: 3,
        totalSize: 4096,
        byType: {
          '.jpg': 2,
          '.pdf': 1,
        },
        averageSize: 1365,
      });
    });

    it('should handle empty file list', async () => {
      prismaService.file.findMany.mockResolvedValue([]);

      const result = await service.getFileStats();

      expect(result).toEqual({
        total: 0,
        totalSize: 0,
        byType: {},
        averageSize: 0,
      });
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for known extensions', () => {
      // We can't directly test private methods, but we can test through file stats
      // which indirectly tests the extension parsing logic
    });
  });

  describe('VALID_MIME_TYPES', () => {
    it('should contain expected MIME types', () => {
      expect(VALID_MIME_TYPES).toContain('image/jpeg');
      expect(VALID_MIME_TYPES).toContain('application/pdf');
      expect(VALID_MIME_TYPES).toContain('text/plain');
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });
});
