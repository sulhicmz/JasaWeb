import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  Get,
  Param,
  Res,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { FileStorageService } from '../common/services/file-storage.service';
import { LocalFileStorageService } from '../common/services/local-file-storage.service';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as path from 'path';
import type { UploadedFilePayload } from './file.service';

// Define file upload validation options
const VALID_MIME_TYPES = [
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('files')
@UseGuards(RolesGuard) // Use the roles guard
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly fileStorageService: FileStorageService,
    private readonly localFileStorageService: LocalFileStorageService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles can upload files
  async uploadFile(
    @UploadedFile() file: UploadedFilePayload,
    @CurrentOrganizationId() organizationId: string,
    @Query('projectId') projectId?: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required for file uploads');
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Validate file type
    if (!VALID_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    // Validate project ID if provided
    if (projectId) {
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new BadRequestException('Project not found or does not belong to your organization');
      }
    }

    try {
      // Determine if we're using S3 or local storage based on config
      const useS3 = this.configService.get<string>('STORAGE_TYPE') === 's3';
      
      let fileIdentifier: string;
      
      if (useS3) {
        // Upload to S3
        fileIdentifier = await this.fileStorageService.uploadFile(file.buffer, {
          bucket: process.env.S3_BUCKET_NAME || 'default-bucket',
          key: `organizations/${organizationId}/projects/${projectId || 'general'}/${Date.now()}_${file.originalname}`,
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            size: file.size.toString(),
            uploadedBy: 'user_id_placeholder', // Would come from JWT
          },
        });
      } else {
        // Upload to local storage
        const uploadResult = await this.localFileStorageService.uploadFile(file.buffer, {
          directory: `./uploads/${organizationId}`,
          filename: `${Date.now()}_${file.originalname}`,
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
        });
        
        fileIdentifier = uploadResult.filename;
      }

      // Save file record to database
      const createdFile = await this.multiTenantPrisma.file.create({
        data: {
          projectId,
          filename: file.originalname,
          version: '1.0', // Initial version
          size: file.size,
          uploadedById: 'user_id_placeholder', // Would come from JWT
        },
      });

      this.logger.log(`File uploaded: ${file.originalname} for organization ${organizationId}`);
      
      return {
        id: createdFile.id,
        filename: createdFile.filename,
        size: createdFile.size,
        uploadedAt: createdFile.createdAt,
        url: `/files/download/${createdFile.id}`, // Temporary - would generate actual signed URL in real app
      };
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw new BadRequestException('Error uploading file');
    }
  }

  @UseGuards(ThrottlerGuard)
  @Get('download/:id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles can download files
  async downloadFile(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
    @Res() res: Response,
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
          bucket: process.env.S3_BUCKET_NAME || 'default-bucket',
          key: `organizations/${organizationId}/projects/${fileRecord.projectId || 'general'}/${fileRecord.filename}`,
          expiresIn: 3600, // 1 hour
        });
        
        // Redirect to the signed URL
        res.redirect(signedUrl);
      } else {
        // Get file from local storage
        const filePath = `./uploads/${organizationId}/${fileRecord.filename}`;
        const fileBuffer = await this.localFileStorageService.getFile(filePath);
        
        // Set response headers based on file type
        res.setHeader('Content-Type', this.getMimeType(fileRecord.filename));
        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.filename}"`);
        res.setHeader('Content-Length', fileRecord.size || 0);
        
        // Send the file
        res.send(fileBuffer);
      }
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error downloading file: ${errorMessage}`);
      throw new BadRequestException('Error downloading file');
    }
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only org owners and admins can delete files
  async deleteFile(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
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
          process.env.S3_BUCKET_NAME || 'default-bucket',
          `organizations/${organizationId}/projects/${fileRecord.projectId || 'general'}/${fileRecord.filename}`,
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

      this.logger.log(`File deleted: ${fileRecord.filename} for organization ${organizationId}`);
      
      return { message: 'File deleted successfully' };
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Error deleting file: ${errorMessage}`);
      throw new BadRequestException('Error deleting file');
    }
  }

  /**
   * Helper method to get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}