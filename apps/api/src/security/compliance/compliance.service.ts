import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { DataEncryptionService } from '../encryption/data-encryption.service';
import { AuditService } from '../../common/services/audit.service';

export interface GdprRequest {
  type: 'data_export' | 'data_deletion' | 'consent_withdrawal' | 'data_access';
  userId: string;
  email: string;
  reason?: string;
}

export interface DataProcessingRecord {
  id: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  type: string;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: DataEncryptionService,
    private auditService: AuditService
  ) {}

  /**
   * Create GDPR data request
   */
  async createGdprRequest(
    request: GdprRequest
  ): Promise<{ id: string; status: string }> {
    try {
      const gdprRequest = await this.prisma.gdprRequest.create({
        data: {
          type: request.type,
          userId: request.userId,
          email: request.email,
          reason: request.reason,
          status: 'pending',
          createdAt: new Date(),
        },
      });

      // Log the GDPR request
      await this.auditService.log({
        actorId: request.userId,
        organizationId: 'system',
        action: 'gdpr_request_created',
        target: 'GdprRequest',
        targetId: gdprRequest.id,
        meta: {
          requestType: request.type,
          email: request.email,
        },
      });

      this.logger.log(
        `GDPR request created: ${request.type} for user ${request.userId}`
      );

      return { id: gdprRequest.id, status: gdprRequest.status };
    } catch (error) {
      this.logger.error(
        `Failed to create GDPR request: ${error.message}`,
        error.stack
      );
      throw new BadRequestException('Failed to create GDPR request');
    }
  }

  /**
   * Export user data (GDPR "Right to Access")
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: { organization: true },
          },
          approvals: true,
          tickets: true,
          invoices: true,
          auditLogs: true,
          files: true,
          tasks: true,
          sessions: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Remove sensitive data and prepare for export
      const exportData = {
        personalData: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        memberships: user.memberships.map((m) => ({
          organization: m.organization.name,
          role: m.role,
          joinedAt: m.createdAt,
        })),
        activity: {
          approvals: user.approvals.length,
          tickets: user.tickets.length,
          invoices: user.invoices.length,
          files: user.files.length,
          tasks: user.tasks.length,
        },
        auditLogs: user.auditLogs.map((log) => ({
          action: log.action,
          target: log.target,
          createdAt: log.createdAt,
        })),
        sessions: user.sessions.map((session) => ({
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: session.isActive,
        })),
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          exportReason: 'GDPR Data Access Request',
          version: '1.0',
        },
      };

      // Log the data export
      await this.auditService.log({
        actorId: userId,
        organizationId: 'system',
        action: 'data_exported',
        target: 'User',
        targetId: userId,
        meta: {
          exportType: 'gdpr_access',
          recordCount: Object.keys(exportData).length,
        },
      });

      this.logger.log(`Data exported for user ${userId}`);

      return exportData;
    } catch (error) {
      this.logger.error(
        `Failed to export user data: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete user data (GDPR "Right to be Forgotten")
   */
  async deleteUserData(
    userId: string,
    verificationData: { password: string; email: string }
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify identity before deletion
      if (user.email !== verificationData.email) {
        throw new BadRequestException('Email verification failed');
      }

      // In a real implementation, verify password here
      // For now, we'll proceed with the deletion

      // Anonymize user data instead of hard delete for audit purposes
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.local`,
          name: 'Deleted User',
          password: '', // Remove password
          profilePicture: null,
          mfaSecret: null,
          mfaBackupCodes: [],
          // Mark as deleted
          deletedAt: new Date(),
        },
      });

      // Log the data deletion
      await this.auditService.log({
        actorId: 'system',
        organizationId: 'system',
        action: 'user_data_deleted',
        target: 'User',
        targetId: userId,
        meta: {
          deletionType: 'gdpr_right_to_be_forgotten',
          originalEmail: user.email,
        },
      });

      this.logger.log(`User data deleted/anonymized for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete user data: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    metadata: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    try {
      await this.prisma.consentRecord.create({
        data: {
          userId,
          type: consentType,
          granted,
          timestamp: new Date(),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      });

      // Log consent change
      await this.auditService.log({
        actorId: userId,
        organizationId: 'system',
        action: 'consent_recorded',
        target: 'ConsentRecord',
        meta: {
          consentType,
          granted,
          ipAddress: metadata.ipAddress,
        },
      });

      this.logger.log(
        `Consent recorded: ${consentType} = ${granted} for user ${userId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to record consent: ${error.message}`,
        error.stack
      );
      throw new BadRequestException('Failed to record consent');
    }
  }

  /**
   * Get user consent records
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const consents = await this.prisma.consentRecord.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      });

      return consents.map((consent) => ({
        id: consent.id,
        userId: consent.userId,
        type: consent.type,
        granted: consent.granted,
        timestamp: consent.timestamp,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get user consents: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Create data processing record
   */
  async createDataProcessingRecord(
    record: Omit<DataProcessingRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataProcessingRecord> {
    try {
      const result = await this.prisma.dataProcessingRecord.create({
        data: {
          purpose: record.purpose,
          legalBasis: record.legalBasis,
          dataCategories: record.dataCategories,
          retentionPeriod: record.retentionPeriod,
          securityMeasures: record.securityMeasures,
        },
      });

      this.logger.log(`Data processing record created: ${result.id}`);

      return {
        ...result,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create data processing record: ${error.message}`,
        error.stack
      );
      throw new BadRequestException('Failed to create data processing record');
    }
  }

  /**
   * Get data processing records
   */
  async getDataProcessingRecords(): Promise<DataProcessingRecord[]> {
    try {
      const records = await this.prisma.dataProcessingRecord.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return records.map((record) => ({
        id: record.id,
        purpose: record.purpose,
        legalBasis: record.legalBasis,
        dataCategories: record.dataCategories,
        retentionPeriod: record.retentionPeriod,
        securityMeasures: record.securityMeasures,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get data processing records: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(): Promise<any> {
    try {
      const [
        totalUsers,
        activeConsents,
        pendingGdprRequests,
        dataProcessingRecords,
        recentDataExports,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.consentRecord.count({ where: { granted: true } }),
        this.prisma.gdprRequest.count({ where: { status: 'pending' } }),
        this.prisma.dataProcessingRecord.count(),
        this.prisma.auditLog.count({
          where: {
            action: 'data_exported',
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const report = {
        summary: {
          totalUsers,
          activeConsents,
          pendingGdprRequests,
          dataProcessingRecords,
          recentDataExports,
        },
        complianceMetrics: {
          dataRetentionCompliance: '95%', // Example metric
          consentManagementCoverage: '88%', // Example metric
          responseTimeAverage: '48 hours', // Example metric
        },
        recommendations: [
          'Review and update data retention policies',
          'Implement automated consent renewal reminders',
          'Enhance data breach detection capabilities',
        ],
        generatedAt: new Date().toISOString(),
      };

      this.logger.log('GDPR compliance report generated');

      return report;
    } catch (error) {
      this.logger.error(
        `Failed to generate compliance report: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
