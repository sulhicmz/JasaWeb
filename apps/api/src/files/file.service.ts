import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { DynamicFileStorageService } from '../common/services/dynamic-file-storage.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { storageConfigRegistry } from '@jasaweb/config';

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
  storageType?: string;
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
    private readonly dynamicFileStorageService: DynamicFileStorageService,
    private readonly configService: ConfigService
  ) {}

  async uploadFile(
    fileUploadDto: FileUploadDto,
    organizationId: string
  ): Promise<FileUploadResult> {
    const {
      file,
      projectId,
      uploadedById,
      storageType: requestedStorageType,
    } = fileUploadDto;

    if (!projectId) {
      throw new BadRequestException('Project ID is required for file uploads');
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Get current storage configuration
    const storageConfig = storageConfigRegistry.getCurrentStorageConfig();
    const currentStorageType = storageConfigRegistry.getCurrentStorageType();

    // Validate requested storage type if provided
    if (requestedStorageType) {
      const switchResult = storageConfigRegistry.switchStorageType(
        requestedStorageType as 'local' | 's3' | 'minio' | 'gcs' | 'azure'
      );
      if (!switchResult.isValid) {
        throw new BadRequestException(
          `Storage type '${requestedStorageType}' is not available: ${switchResult.errors.join(', ')}`
        );
      }
    }

    // Validate file size using dynamic config
    const maxSize = storageConfig?.validation.maxFileSize || MAX_FILE_SIZE;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
      );
    }

    // Validate file type using dynamic config
    const allowedTypes =
      storageConfig?.validation.allowedMimeTypes || VALID_MIME_TYPES;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Validate project ID exists and belongs to organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new BadRequestException(
        'Project not found or does not belong to your organization'
      );
    }

    try {
      // Generate unique file identifier
      const timestampedFilename = `${Date.now()}_${file.originalname}`;
      const fileKey = `organizations/${organizationId}/projects/${projectId}/${timestampedFilename}`;

      // Upload using dynamic storage service
      await this.dynamicFileStorageService.uploadFile(file.buffer, {
        key: fileKey,
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          size: file.size.toString(),
          uploadedBy: uploadedById,
          organizationId,
          projectId,
        },
        bucket: storageConfig?.validation.bucketRequired
          ? this.configService.get('S3_BUCKET') ||
            this.configService.get('MINIO_BUCKET')
          : undefined,
      });

      // Save file record to database
      const createdFile = await this.multiTenantPrisma.file.create({
        data: {
          project: {
            connect: { id: projectId },
          },
          filename: timestampedFilename,
          version: '1.0',
          size: file.size,
          uploadedBy: {
            connect: { id: uploadedById },
          },
        },
      });

      this.logger.log(
        `File uploaded: ${file.originalname} for organization ${organizationId} (storage: ${currentStorageType})`
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

      // Switch back to original storage type if requested type failed
      if (requestedStorageType) {
        storageConfigRegistry.switchStorageType(currentStorageType);
      }

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
        include: {
          project: {
            select: { id: true },
          },
        },
      });

      if (!fileRecord) {
        throw new BadRequestException('File not found');
      }

      // Get current storage configuration
      const storageConfig = storageConfigRegistry.getCurrentStorageConfig();
      const currentStorageType = storageConfigRegistry.getCurrentStorageType();

      // Build file key
      const fileKey = `organizations/${organizationId}/projects/${fileRecord.projectId || 'general'}/${fileRecord.filename}`;

      // Try signed URL first (for cloud storage)
      if (storageConfig?.type !== 'local') {
        try {
          const signedUrl =
            await this.dynamicFileStorageService.generateSignedUrl(
              fileKey,
              3600 // 1 hour
            );
          response.redirect(signedUrl);
          return;
        } catch (signedUrlError) {
          this.logger.warn(
            `Signed URL generation failed, falling back to direct download: ${signedUrlError}`
          );
        }
      }

      // Direct download
      const fileBuffer =
        await this.dynamicFileStorageService.downloadFile(fileKey);

      // Set response headers based on file type
      response.setHeader('Content-Type', this.getMimeType(fileRecord.filename));
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileRecord.filename}"`
      );
      response.setHeader('Content-Length', fileRecord.size || 0);

      // Send the file
      response.send(fileBuffer);

      this.logger.log(
        `File downloaded: ${fileRecord.filename} for organization ${organizationId} (storage: ${currentStorageType})`
      );
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
        include: {
          project: {
            select: { id: true },
          },
        },
      });

      if (!fileRecord) {
        throw new BadRequestException('File not found');
      }

      // Get current storage configuration
      const currentStorageType = storageConfigRegistry.getCurrentStorageType();

      // Build file key
      const fileKey = `organizations/${organizationId}/projects/${fileRecord.projectId || 'general'}/${fileRecord.filename}`;

      // Delete from storage
      await this.dynamicFileStorageService.deleteFile(fileKey);

      // Delete file record from database
      await this.multiTenantPrisma.file.delete({
        where: { id },
      });

      this.logger.log(
        `File deleted: ${fileRecord.filename} for organization ${organizationId} (storage: ${currentStorageType})`
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

  async getFileStats(projectId?: string) {
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
    const totalSize = files.reduce(
      (sum: number, file: { size: number | null }) => sum + (file.size || 0),
      0
    );

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
      [
        '.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      ['.ppt', 'application/vnd.ms-powerpoint'],
      [
        '.pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      ['.xls', 'application/vnd.ms-excel'],
      [
        '.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
    ]);

    return mimeTypes.get(ext) || 'application/octet-stream';
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
