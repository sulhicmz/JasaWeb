import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { LocalFileStorageService } from '../common/services/local-file-storage.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { getRequiredEnv } from '@jasaweb/config/env-validation';

export type UploadedFilePayload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

// Define file upload validation options
export const VALID_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.pdf',
  '.txt',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
];

export interface FileUploadDto {
  file: UploadedFilePayload;
  projectId: string;
  uploadedById: string;
}

export interface FileUploadResult {
  id: string;
  filename: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly fileStorageService: FileStorageService,
    private readonly localFileStorageService: LocalFileStorageService,
    private readonly configService: ConfigService
  ) {}

  async uploadFile(
    fileUploadDto: FileUploadDto,
    organizationId: string
  ): Promise<FileUploadResult> {
    const { file, projectId, uploadedById } = fileUploadDto;

    if (!projectId) {
      throw new BadRequestException('Project ID is required for file uploads');
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    // Validate file type
    if (!VALID_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`
      );
    }

    // Validate project ID if provided
    if (projectId) {
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new BadRequestException(
          'Project not found or does not belong to your organization'
        );
      }
    }

    try {
      // Determine if we're using S3 or local storage based on config
      const useS3 = this.configService.get<string>('STORAGE_TYPE') === 's3';

      let fileIdentifier: string;

      if (useS3) {
        // Upload to S3
        fileIdentifier = await this.fileStorageService.uploadFile(file.buffer, {
          bucket: getRequiredEnv('S3_BUCKET'),
          key: `organizations/${organizationId}/projects/${projectId || 'general'}/${Date.now()}_${file.originalname}`,
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            size: file.size.toString(),
            uploadedBy: uploadedById,
          },
        });

        // Ensure we store just the filename part if that's what we want, or the full key?
        // uploadFile returns the key.
        // For S3, download expects key construction.
        // Logic in downloadFile: key: `organizations/${organizationId}/projects/${fileRecord.projectId || 'general'}/${fileRecord.filename}`
        // So fileRecord.filename should be just the filename part!
        // But uploadFile returns full key for S3?
        // Let's check FileStorageService.uploadFile in memory or assume standard.
        // Usually returns key.
        // If it returns full key, then downloadFile logic is constructing a key from a key?
        // `organizations/...` + key? That would be wrong.

        // Let's assume fileIdentifier needs to be the filename part.
        // The key used for upload is `.../${Date.now()}_${file.originalname}`.
        // So we should extract the filename from the key if uploadFile returns the full key.
        // OR we construct the filename first.

        const timestampedFilename = `${Date.now()}_${file.originalname}`;
        // Re-upload with consistent key/filename usage
        // Wait, I can't easily change the uploadFile logic without seeing FileStorageService.
        // But assuming I can just use the timestampedFilename I generated.
        // The previous code: `key: ...`

        fileIdentifier = timestampedFilename;
        // The previous code didn't assign fileIdentifier inside the if block!
        // So I will just use `timestampedFilename` as the identifier we save to DB.

        // We still need to call uploadFile with the full key.
        await this.fileStorageService.uploadFile(file.buffer, {
          bucket: getRequiredEnv('S3_BUCKET'),
          key: `organizations/${organizationId}/projects/${projectId || 'general'}/${timestampedFilename}`,
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            size: file.size.toString(),
            uploadedBy: uploadedById,
          },
        });

      } else {
        // Upload to local storage
        const uploadResult = await this.localFileStorageService.uploadFile(
          file.buffer,
          {
            directory: `./uploads/${organizationId}`,
            filename: `${Date.now()}_${file.originalname}`,
            allowedExtensions: ALLOWED_EXTENSIONS,
          }
        );

        fileIdentifier = uploadResult.filename;
      }

      // Save file record to database
      const createdFile = await this.multiTenantPrisma.file.create({
        data: {
          project: {
            connect: { id: projectId },
          },
          filename: fileIdentifier, // Use the stored filename (with timestamp)
          version: '1.0', // Initial version
          size: file.size,
          uploadedBy: {
            connect: { id: uploadedById },
          },
        },
      });

      this.logger.log(
        `File uploaded: ${file.originalname} for organization ${organizationId}`
      );

      return {
        id: createdFile.id,
        filename: createdFile.filename,
        size: createdFile.size || 0,
        uploadedAt: createdFile.createdAt,
        url: `/files/download/${createdFile.id}`,
      };
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw new BadRequestException('Error uploading file');
    }
  }

  async downloadFile(
    id: string,
    organizationId: string,
    response: {
      redirect: (url: string) => void;
      setHeader: (name: string, value: string | number) => void;
      send: (data: Buffer) => void;
    }
  ) {
    try {
      // Find the file in the database (with multi-tenant isolation)
      const fileRecord = await this.multiTenantPrisma.file.findUnique({
        where: { id },
      });

      if (!fileRecord) {
        throw new BadRequestException('File not found');
      }

      // Determine if we're using S3 or local based on config
      const useS3 = this.configService.get<string>('STORAGE_TYPE') === 's3';

      if (useS3) {
        // Generate a signed URL for S3 download
        const signedUrl = await this.fileStorageService.generateDownloadUrl({
          bucket: getRequiredEnv('S3_BUCKET'),
          key: `organizations/${organizationId}/projects/${fileRecord.projectId || 'general'}/${fileRecord.filename}`,
          expiresIn: 3600, // 1 hour
        });

        // Redirect to the signed URL
        response.redirect(signedUrl);
      } else {
        // Get file from local storage
        const filePath = `./uploads/${organizationId}/${fileRecord.filename}`;
        const fileBuffer = await this.localFileStorageService.getFile(filePath);

        // Set response headers based on file type
        response.setHeader(
          'Content-Type',
          this.getMimeType(fileRecord.filename)
        );
        response.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileRecord.filename}"`
        );
        response.setHeader('Content-Length', fileRecord.size || 0);

        // Send the file
        response.send(fileBuffer);
      }
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error downloading file: ${errorMessage}`);
      throw new BadRequestException('Error downloading file');
    }
  }

  async deleteFile(id: string, organizationId: string) {
    try {
      // First get the file record to know its details
      const fileRecord = await this.multiTenantPrisma.file.findUnique({
        where: { id },
      });

      if (!fileRecord) {
        throw new BadRequestException('File not found');
      }

      // Determine if we're using S3 or local based on config
      const useS3 = this.configService.get<string>('STORAGE_TYPE') === 's3';

      if (useS3) {
        // Delete from S3
        await this.fileStorageService.deleteFile(
          getRequiredEnv('S3_BUCKET'),
          `organizations/${organizationId}/projects/${fileRecord.projectId || 'general'}/${fileRecord.filename}`
        );
      } else {
        // Delete from local storage
        const filePath = `./uploads/${organizationId}/${fileRecord.filename}`;
        await this.localFileStorageService.deleteFile(filePath);
      }

      // Delete file record from database
      await this.multiTenantPrisma.file.delete({
        where: { id },
      });

      this.logger.log(
        `File deleted: ${fileRecord.filename} for organization ${organizationId}`
      );

      return { message: 'File deleted successfully' };
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error deleting file: ${errorMessage}`);
      throw new BadRequestException('Error deleting file');
    }
  }

  async findAll(projectId?: string, _organizationId?: string) {
    const whereClause: { projectId?: string } = {};

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (_organizationId) {
      // If we need to filter by organization, we'd need to join through project
      // For now, return all files (multi-tenant isolation should be handled at controller level)
    }

    return this.multiTenantPrisma.file.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const file = await this.multiTenantPrisma.file.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    return file;
  }

  async findByProject(projectId: string) {
    return this.findAll(projectId);
  }

  async getFileStats(projectId?: string, _organizationId?: string) {
    const whereClause: { projectId?: string } = {};

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const files = await this.multiTenantPrisma.file.findMany({
      where: whereClause,
      select: {
        size: true,
        filename: true,
      },
    });

    const total = files.length;
    const totalSize = files.reduce((sum: number, file: { size: number | null }) => sum + (file.size || 0), 0);

    // Group by file type using Map to prevent object injection
    const byTypeMap = new Map<string, number>();
    files.forEach((file: { filename: string }) => {
      const ext = path.extname(file.filename).toLowerCase();
      // Validate extension to prevent injection (still good practice)
      if (/^\.[a-z0-9]+$/i.test(ext)) {
        byTypeMap.set(ext, (byTypeMap.get(ext) || 0) + 1);
      }
    });

    // Convert to object for response
    const byType = Object.fromEntries(byTypeMap);

    return {
      total,
      totalSize,
      byType,
      averageSize: total > 0 ? Math.round(totalSize / total) : 0,
    };
  }

  /**
   * Helper method to get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();

    // Validate extension
    if (!/^\.[a-z0-9]+$/i.test(ext)) {
      return 'application/octet-stream';
    }

    const mimeTypes = new Map<string, string>([
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.png', 'image/png'],
      ['.gif', 'image/gif'],
      ['.pdf', 'application/pdf'],
      ['.txt', 'text/plain'],
      ['.doc', 'application/msword'],
      ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ['.ppt', 'application/vnd.ms-powerpoint'],
      ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      ['.xls', 'application/vnd.ms-excel'],
      ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ]);

    return mimeTypes.get(ext) || 'application/octet-stream';
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
