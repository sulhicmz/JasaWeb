import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
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
import { ComplianceService, GdprRequest } from './compliance.service';

@ApiTags('GDPR Compliance')
@Controller('security/compliance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('gdpr-request')
  @ApiOperation({ summary: 'Create GDPR data request' })
  @ApiResponse({
    status: 201,
    description: 'GDPR request created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGdprRequest(
    @Request() req,
    @Body() gdprRequest: GdprRequest
  ): Promise<{ id: string; status: string }> {
    return this.complianceService.createGdprRequest({
      ...gdprRequest,
      userId: req.user.id,
    });
  }

  @Get('data-export')
  @ApiOperation({ summary: 'Export user data (GDPR Right to Access)' })
  @ApiResponse({
    status: 200,
    description: 'User data exported successfully',
    schema: {
      type: 'object',
      properties: {
        personalData: { type: 'object' },
        memberships: { type: 'array' },
        activity: { type: 'object' },
        auditLogs: { type: 'array' },
        sessions: { type: 'array' },
        exportMetadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async exportUserData(@Request() req): Promise<any> {
    return this.complianceService.exportUserData(req.user.id);
  }

  @Post('data-deletion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user data (GDPR Right to be Forgotten)' })
  @ApiResponse({
    status: 200,
    description: 'User data deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Verification failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUserData(
    @Request() req,
    @Body() verificationData: { password: string; email: string }
  ): Promise<{ message: string }> {
    await this.complianceService.deleteUserData(req.user.id, verificationData);
    return { message: 'User data deletion request processed successfully' };
  }

  @Get('consents')
  @ApiOperation({ summary: 'Get user consent records' })
  @ApiResponse({
    status: 200,
    description: 'Consent records retrieved successfully',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        type: { type: 'string' },
        granted: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserConsents(@Request() req): Promise<any[]> {
    return this.complianceService.getUserConsents(req.user.id);
  }

  @Post('consent')
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({
    status: 201,
    description: 'Consent recorded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recordConsent(
    @Request() req,
    @Body()
    consentData: {
      consentType: string;
      granted: boolean;
    }
  ): Promise<{ message: string }> {
    await this.complianceService.recordConsent(
      req.user.id,
      consentData.consentType,
      consentData.granted,
      {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || 'Unknown',
      }
    );
    return { message: 'Consent recorded successfully' };
  }

  @Get('data-processing-records')
  @ApiOperation({ summary: 'Get data processing records' })
  @ApiResponse({
    status: 200,
    description: 'Data processing records retrieved successfully',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        purpose: { type: 'string' },
        legalBasis: { type: 'string' },
        dataCategories: { type: 'array', items: { type: 'string' } },
        retentionPeriod: { type: 'string' },
        securityMeasures: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDataProcessingRecords(): Promise<any[]> {
    return this.complianceService.getDataProcessingRecords();
  }

  @Get('compliance-report')
  @ApiOperation({ summary: 'Generate GDPR compliance report' })
  @ApiResponse({
    status: 200,
    description: 'Compliance report generated successfully',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'object' },
        complianceMetrics: { type: 'object' },
        recommendations: { type: 'array' },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateComplianceReport(): Promise<any> {
    return this.complianceService.generateComplianceReport();
  }
}
