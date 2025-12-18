import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { execSync } from 'child_process';
import { join } from 'path';
import { SecureFileOperations } from './secure-file-operations';

export interface VulnerabilityAlert {
  severity: 'critical' | 'high' | 'moderate' | 'low';
  package: string;
  title: string;
  url?: string;
  fixedIn?: string;
  recommendation: string;
  detectedAt: Date;
}

export interface SecurityReport {
  id: string;
  timestamp: Date;
  totalVulnerabilities: number;
  severityBreakdown: Record<string, number>;
  criticalVulnerabilities: VulnerabilityAlert[];
  highVulnerabilities: VulnerabilityAlert[];
  moderateVulnerabilities: VulnerabilityAlert[];
  recommendations: string[];
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly reportsPath = join(process.cwd(), 'security-reports');

  constructor() {
    this.ensureReportsDirectory();
  }

  private ensureReportsDirectory() {
    try {
      SecureFileOperations.createDirectory('security-reports', {
        recursive: true,
      });
    } catch (error) {
      this.logger.error('Failed to create security reports directory:', error);
      throw error;
    }
  }

  @Cron('0 2 * * *') // Run daily at 2 AM
  async performDailySecurityScan(): Promise<SecurityReport> {
    this.logger.log('Starting scheduled security vulnerability scan...');

    try {
      const report = await this.generateSecurityReport();
      await this.saveReport(report);
      await this.alertOnCriticalVulnerabilities(report);

      this.logger.log(
        `Security scan completed. Found ${report.totalVulnerabilities} vulnerabilities`
      );
      return report;
    } catch (error) {
      this.logger.error('Security scan failed:', error);
      throw error;
    }
  }

  private async runVulnerabilityAudit(): Promise<string> {
    try {
      const auditOutput = execSync('npm audit --json', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return auditOutput;
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      // We still want to get the output in that case
      const errorWithStdout = error as { stdout?: string; message?: string };
      return (
        errorWithStdout.stdout || errorWithStdout.message || 'Audit failed'
      );
    }
  }

  private parseAuditResults(auditOutput: string): VulnerabilityAlert[] {
    try {
      const auditData = JSON.parse(auditOutput);
      const vulnerabilities: VulnerabilityAlert[] = [];

      if (auditData.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(
          auditData.vulnerabilities
        )) {
          const vuln = vulnData as {
            severity: string;
            title: string;
            url?: string;
            fixAvailable?: { version: string };
            recommendation?: string;
          };

          vulnerabilities.push({
            severity: vuln.severity as any,
            package: packageName,
            title: vuln.title,
            url: vuln.url,
            fixedIn: vuln.fixAvailable?.version,
            recommendation:
              vuln.recommendation || `Update ${packageName} to latest version`,
            detectedAt: new Date(),
          });
        }
      }

      return vulnerabilities;
    } catch (error) {
      this.logger.error('Failed to parse audit results:', error);
      return [];
    }
  }

  private async generateSecurityReport(): Promise<SecurityReport> {
    const auditOutput = await this.runVulnerabilityAudit();
    const vulnerabilities = this.parseAuditResults(auditOutput);

    const severityBreakdown = vulnerabilities.reduce(
      (acc, vuln) => {
        acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const criticalVulns = vulnerabilities.filter(
      (v) => v.severity === 'critical'
    );
    const highVulns = vulnerabilities.filter((v) => v.severity === 'high');
    const moderateVulns = vulnerabilities.filter(
      (v) => v.severity === 'moderate'
    );

    const recommendations = [
      'Update all critical and high severity packages immediately',
      'Review and moderate severity packages within 2 weeks',
      'Implement automated dependency scanning in CI/CD',
      'Consider using npm audit fix for automatic updates',
    ];

    return {
      id: `security-report-${Date.now()}`,
      timestamp: new Date(),
      totalVulnerabilities: vulnerabilities.length,
      severityBreakdown,
      criticalVulnerabilities: criticalVulns,
      highVulnerabilities: highVulns,
      moderateVulnerabilities: moderateVulns,
      recommendations,
    };
  }

  private async saveReport(report: SecurityReport): Promise<void> {
    try {
      // Sanitize report ID to prevent path traversal
      const sanitizedId = report.id.replace(/[^a-zA-Z0-9\-_]/g, '');
      const filename = `security-report-${sanitizedId}.json`;

      SecureFileOperations.writeFile(
        filename,
        JSON.stringify(report, null, 2),
        { mode: 0o640 },
        this.reportsPath
      );

      this.logger.log(`Security report saved: ${filename}`);
    } catch (error: unknown) {
      this.logger.error('Failed to save security report:', error);
      throw error;
    }
  }

  async getLatestReport(): Promise<SecurityReport | null> {
    try {
      const files = SecureFileOperations.readDirectory(
        this.reportsPath || 'security-reports'
      );

      // Filter for security report files and sort by filename (which includes timestamp)
      const reportFiles = files
        .filter(
          (file: string) =>
            file.startsWith('security-report-') && file.endsWith('.json')
        )
        .sort()
        .reverse();

      if (reportFiles.length === 0) {
        return null;
      }

      const latestFile = reportFiles[0];
      if (!latestFile) {
        return null;
      }
      const fileContent = SecureFileOperations.readFile(
        latestFile,
        'utf-8',
        'security-reports'
      );

      try {
        const parsed = JSON.parse(fileContent);
        return this.validateSecurityReport(parsed);
      } catch (parseError) {
        this.logger.error(
          `Failed to parse security report file: ${latestFile}`,
          parseError
        );
        return null;
      }
    } catch (error) {
      this.logger.error('Failed to retrieve latest security report:', error);
      return null;
    }
  }

  private validateSecurityReport(data: any): SecurityReport {
    // Basic validation to ensure the data structure is correct
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid security report data');
    }

    const requiredFields = [
      'id',
      'timestamp',
      'totalVulnerabilities',
      'severityBreakdown',
    ];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return data as SecurityReport;
  }

  private alertOnCriticalVulnerabilities(report: SecurityReport): void {
    const criticalCount = report.criticalVulnerabilities.length;
    const highCount = report.highVulnerabilities.length;

    if (criticalCount > 0) {
      this.logger.error(
        `🚨 CRITICAL SECURITY ALERT: ${criticalCount} critical vulnerabilities found!`
      );

      report.criticalVulnerabilities.forEach((vuln) => {
        this.logger.error(
          `CRITICAL: ${vuln.package} - ${vuln.title} | Fix: ${vuln.recommendation}`
        );
      });
    }

    if (highCount > 0) {
      this.logger.warn(
        `⚠️  HIGH SEVERITY ALERT: ${highCount} high vulnerabilities found!`
      );

      report.highVulnerabilities.forEach((vuln) => {
        this.logger.warn(
          `HIGH: ${vuln.package} - ${vuln.title} | Fix: ${vuln.recommendation}`
        );
      });
    }
  }
}
