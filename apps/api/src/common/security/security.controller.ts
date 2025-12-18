import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  SecurityMonitoringService,
  SecurityReport,
} from './security-monitoring.service';

@ApiTags('Security')
@Controller('security')
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(
    private readonly securityMonitoringService: SecurityMonitoringService
  ) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger security vulnerability scan' })
  @ApiResponse({
    status: 200,
    description: 'Security scan completed successfully',
  })
  @ApiResponse({ status: 500, description: 'Security scan failed' })
  async runSecurityScan(): Promise<SecurityReport> {
    try {
      this.logger.log('Manual security scan triggered via API');
      const report =
        await this.securityMonitoringService.performDailySecurityScan();
      return report;
    } catch (error) {
      this.logger.error('Manual security scan failed:', error);
      throw new BadRequestException(
        'Security scan failed. Check logs for details.'
      );
    }
  }

  @Get('report/latest')
  @ApiOperation({ summary: 'Get latest security report' })
  @ApiResponse({
    status: 200,
    description: 'Latest security report retrieved successfully',
  })
  async getLatestReport() {
    const report = await this.securityMonitoringService.getLatestReport();

    if (!report) {
      return {
        message: 'No security reports found',
        recommendation: 'Run a security scan to generate the first report',
      };
    }

    return report;
  }

  @Get('report/history')
  @ApiOperation({ summary: 'Get security report history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of reports to retrieve (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Security report history retrieved successfully',
  })
  async getReportHistory(@Query('limit') limit?: number) {
    const reportLimit = limit ? Math.min(parseInt(limit.toString()), 50) : 10;
    const reports =
      await this.securityMonitoringService.getReportHistory(reportLimit);

    return {
      reports,
      total: reports.length,
      limit: reportLimit,
    };
  }

  @Get('package/check')
  @ApiOperation({ summary: 'Check security of specific package' })
  @ApiQuery({
    name: 'package',
    required: true,
    description: 'Package name to check',
  })
  @ApiResponse({ status: 200, description: 'Package security check completed' })
  async checkPackageSecurity(@Query('package') packageName: string) {
    if (!packageName || packageName.trim().length === 0) {
      throw new BadRequestException('Package name is required');
    }

    const vulnerabilities =
      await this.securityMonitoringService.checkPackageSecurity(packageName);

    return {
      package: packageName,
      scannedAt: new Date(),
      vulnerabilities,
      vulnerabilityCount: vulnerabilities.length,
      status: vulnerabilities.length === 0 ? 'secure' : 'vulnerabilities-found',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get security status overview' })
  @ApiResponse({
    status: 200,
    description: 'Security status retrieved successfully',
  })
  async getSecurityStatus() {
    const latestReport = await this.securityMonitoringService.getLatestReport();

    if (!latestReport) {
      return {
        status: 'no-data',
        message: 'No security scans have been performed',
        lastScan: null,
        recommendations: [
          'Run a security scan to assess the current security status',
        ],
      };
    }

    const hasCriticalOrHigh =
      latestReport.criticalVulnerabilities.length > 0 ||
      latestReport.highVulnerabilities.length > 0;

    return {
      status: hasCriticalOrHigh ? 'attention-required' : 'healthy',
      lastScan: latestReport.timestamp,
      totalVulnerabilities: latestReport.totalVulnerabilities,
      criticalCount: latestReport.criticalVulnerabilities.length,
      highCount: latestReport.highVulnerabilities.length,
      moderateCount: latestReport.moderateVulnerabilities.length,
      severityBreakdown: latestReport.severityBreakdown,
      recommendations: latestReport.recommendations.slice(0, 3), // Top 3 recommendations
      needsImmediateAttention: latestReport.criticalVulnerabilities.length > 0,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get security metrics for dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Security metrics retrieved successfully',
  })
  async getSecurityMetrics() {
    const reports = await this.securityMonitoringService.getReportHistory(30); // Last 30 reports

    if (reports.length === 0) {
      return {
        totalScans: 0,
        currentVulnerabilities: 0,
        trend: 'no-data',
        averageVulnerabilities: 0,
        severityDistribution: {},
      };
    }

    const latestReport = reports[0];
    const previousReport = reports[1];

    // Calculate trend
    let trend: 'improving' | 'degrading' | 'stable';
    if (!previousReport) {
      trend = 'stable';
    } else if (
      latestReport!.totalVulnerabilities < previousReport.totalVulnerabilities
    ) {
      trend = 'improving';
    } else if (
      latestReport!.totalVulnerabilities > previousReport.totalVulnerabilities
    ) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    // Calculate average
    const averageVulnerabilities =
      reports.reduce((sum, report) => sum + report.totalVulnerabilities, 0) /
      reports.length;

    return {
      totalScans: reports.length,
      currentVulnerabilities: latestReport!.totalVulnerabilities,
      trend,
      averageVulnerabilities: Math.round(averageVulnerabilities * 100) / 100,
      severityDistribution: latestReport!.severityBreakdown,
      lastScanDate: latestReport!.timestamp,
      scanFrequency: this.calculateScanFrequency(reports),
    };
  }

  private calculateScanFrequency(reports: SecurityReport[]): string {
    if (reports.length < 2) return 'insufficient-data';

    const latest = new Date(reports[0]!.timestamp);
    const previous = new Date(reports[1]!.timestamp);
    const diffHours =
      (latest.getTime() - previous.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 25) return 'daily';
    if (diffHours <= 169) return 'weekly';
    if (diffHours <= 745) return 'monthly';
    return 'irregular';
  }
}
