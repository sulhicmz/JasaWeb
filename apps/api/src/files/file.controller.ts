import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Res,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FileService, UploadedFilePayload } from './file.service';

@Controller('files')
@UseGuards(RolesGuard)
export class FileController {
  constructor(
    private readonly fileService: FileService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles can upload files
  async uploadFile(
    @UploadedFile() file: UploadedFilePayload,
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string,
    @Query('projectId') projectId?: string
  ) {
    return this.fileService.uploadFile({
      file,
      projectId: projectId!, // Service validates this
      uploadedById: userId || ''
    }, organizationId);
  }

  @UseGuards(ThrottlerGuard)
  @Get('download/:id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles can download files
  async downloadFile(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
    @Res() res: Response
  ) {
    return this.fileService.downloadFile(id, organizationId, res);
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only org owners and admins can delete files
  async deleteFile(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.fileService.deleteFile(id, organizationId);
  }
}
