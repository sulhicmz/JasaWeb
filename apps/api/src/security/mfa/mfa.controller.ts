import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  MfaService,
  MfaSetupDto,
  MfaVerifyDto,
  MfaSetupResponse,
} from './mfa.service';

@ApiTags('Multi-Factor Authentication')
@Controller('security/mfa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  @ApiOperation({ summary: 'Generate MFA secret and backup codes' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup data generated successfully',
    schema: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        qrCode: { type: 'string' },
        backupCodes: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setupMfa(@Request() req): Promise<MfaSetupResponse> {
    return this.mfaService.generateMfaSecret(req.user.id);
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable MFA after verification' })
  @ApiResponse({
    status: 200,
    description: 'MFA enabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code or setup not initiated',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async enableMfa(
    @Request() req,
    @Body() mfaSetupDto: MfaSetupDto
  ): Promise<{ message: string }> {
    return this.mfaService.enableMfa(req.user.id, mfaSetupDto);
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({
    status: 200,
    description: 'MFA disabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async disableMfa(
    @Request() req,
    @Body() body: { password: string }
  ): Promise<{ message: string }> {
    return this.mfaService.disableMfa(req.user.id, body.password);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA token during login' })
  @ApiResponse({
    status: 200,
    description: 'MFA verification result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'MFA not enabled for user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyMfa(
    @Request() req,
    @Body() mfaVerifyDto: MfaVerifyDto
  ): Promise<{ valid: boolean }> {
    const isValid = await this.mfaService.verifyMfaToken(
      req.user.id,
      mfaVerifyDto
    );
    return { valid: isValid };
  }

  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({
    status: 200,
    description: 'Backup codes regenerated successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async regenerateBackupCodes(
    @Request() req,
    @Body() body: { password: string }
  ): Promise<string[]> {
    return this.mfaService.regenerateBackupCodes(req.user.id, body.password);
  }

  @Get('status')
  @ApiOperation({ summary: 'Check MFA status for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMfaStatus(@Request() req): Promise<{ enabled: boolean }> {
    const enabled = await this.mfaService.isMfaEnabled(req.user.id);
    return { enabled };
  }
}
