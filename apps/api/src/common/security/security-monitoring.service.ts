import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { join } from 'path';
import { promises as fs } from 'fs';
import { SecurityValidator } from '../utils/security-validator';

export interface Vulnerability {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  package: string;
  title: string;
  url: string;
  fixedIn?: string;
  recommendation: string;
  detectedAt: Date;
}

export interface SecurityReport {
  id: string;
  timestamp: Date;
  totalVulnerabilities: number;
  severityBreakdown: Record<string, number>;
  criticalVulnerabilities: Vulnerability[];
  highVulnerabilities: Vulnerability[];
  moderateVulnerabilities: Vulnerability[];
  recommendations: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface AuditAdvisory {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  url: string;
  fixAvailable?: {
    version: string;
  };
  recommendation?: string;
}

interface AuditVulnerability {
  [packageName: string]: {
    severity: 'low' | 'moderate' | 'high' | 'critical';
    title: string;
    url: string;
    fixAvailable?: {
      version: string;
    };
    recommendation?: string;
  };
}

interface AuditResult {
  vulnerabilities?: AuditVulnerability;
}

interface NpmAuditError extends Error {
  stdout?: string;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private reportsPath: string;

  constructor() {
    // Initialize with secure literal path
    const secureReportsDir = SecurityValidator.getLiteralPath(
      'SECURITY_REPORTS_DIR'
    );
    this.reportsPath = join(process.cwd(), secureReportsDir);
    this.ensureReportsDirectory();
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      // Use secure literal path for reports directory
      const secureReportsDir = SecurityValidator.getLiteralPath(
        'SECURITY_REPORTS_DIR'
      );
      const reportsPath = join(process.cwd(), secureReportsDir);

      // Validate the path operation
      if (
        !SecurityValidator.validateLiteralOperation(reportsPath, process.cwd())
      ) {
        throw new Error('Reports directory path validation failed');
      }

      await fs.mkdir(reportsPath, { recursive: true });
      this.reportsPath = reportsPath; // Update the instance property
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
      const { execSync } = require('child_process');
      const auditOutput = execSync('npm audit --json', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return auditOutput;
    } catch (error) {
      return (error as NpmAuditError).stdout || '';
    }
  }

  private parseAuditResults(auditOutput: string): Vulnerability[] {
    try {
      const auditResult = JSON.parse(auditOutput) as AuditResult;
      const vulnerabilities: Vulnerability[] = [];

      if (auditResult.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(
          auditResult.vulnerabilities
        )) {
          const vuln = vulnData;
          vulnerabilities.push({
            severity: vuln.severity,
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
      const sanitizedId = report.id.replace(/[^a-zA-Z0-9\-_]/g, '');
      const filename = `security-report-${sanitizedId}.json`;
      const filepath = join(this.reportsPath, filename);

      // Validate file path operation with literal security
      if (
        !SecurityValidator.validateLiteralOperation(filepath, this.reportsPath)
      ) {
        throw new Error('Report file save path validation failed');
      }

      // Validate file extension
      if (!SecurityValidator.validateFileExtension(filename)) {
        throw new Error('Invalid file extension for security report');
      }

      await fs.writeFile(filepath, JSON.stringify(report, null, 2), {
        mode: 0o640,
      });
      this.logger.log(`Security report saved: ${filename}`);
    } catch (error: unknown) {
      this.logger.error('Failed to save security report:', error);
      throw error;
    }
  }

  async getLatestReport(): Promise<SecurityReport | null> {
    try {
      const files = await fs.readdir(this.reportsPath);
      const reportFiles = files
        .filter((file: string) => {
          // Validate file extension for security
          const hasValidExtension =
            SecurityValidator.validateFileExtension(file);
          const hasValidPrefix = file.startsWith('security-report-');
          return hasValidPrefix && hasValidExtension;
        })
        .sort()
        .reverse();

      if (reportFiles.length === 0) {
        return null;
      }

      const latestFile = reportFiles[0];
      if (!latestFile) {
        return null;
      }

      const filepath = join(this.reportsPath, latestFile);

      // Validate file read path operation
      if (
        !SecurityValidator.validateLiteralOperation(filepath, this.reportsPath)
      ) {
        throw new Error('Report file read path validation failed');
      }

      const content = await fs.readFile(filepath, 'utf8');
      return JSON.parse(content) as SecurityReport;
    } catch (error: unknown) {
      this.logger.error('Failed to get latest security report:', error);
      return null;
    }
  }

  async getReportHistory(limit: number = 10): Promise<SecurityReport[]> {
    try {
      // Path is controlled constant from process.cwd() and constant string
      const files = await fs.readdir(this.reportsPath);
      const reportFiles = files
        .filter(
          (file: string) =>
            file.startsWith('security-report-') && file.endsWith('.json')
        )
        .sort()
        .reverse()
        .slice(0, limit);

      const reports: SecurityReport[] = [];

      for (const file of reportFiles) {
        try {
          const filepath = join(this.reportsPath, file);

          // Validate file read path operation
          if (
            !SecurityValidator.validateLiteralOperation(
              filepath,
              this.reportsPath
            )
          ) {
            this.logger.warn(`Invalid file path detected for report: ${file}`);
            continue;
          }

          const content = await fs.readFile(filepath, 'utf8');
          const report = JSON.parse(content) as SecurityReport;
          reports.push(report);
        } catch (error) {
          this.logger.warn(`Failed to parse security report ${file}:`, error);
        }
      }

      return reports;
    } catch (error: unknown) {
      this.logger.error('Failed to get security report history:', error);
      return [];
    }
  }

  async checkPackageSecurity(packageName: string): Promise<Vulnerability[]> {
    try {
      const { execSync } = require('child_process');
      const auditOutput = execSync(`npm audit --json ${packageName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const auditResult = JSON.parse(auditOutput) as AuditResult;
      const vulnerabilities: Vulnerability[] = [];

      if (auditResult.vulnerabilities) {
        for (const [pkgName, vulnData] of Object.entries(
          auditResult.vulnerabilities
        )) {
          if (pkgName === packageName) {
            const vuln = vulnData;
            vulnerabilities.push({
              severity: vuln.severity,
              package: pkgName,
              title: vuln.title || `Vulnerability in ${pkgName}`,
              url: vuln.url || '',
              fixedIn: vuln.fixAvailable?.version,
              recommendation: `Update ${pkgName} to latest version`,
              detectedAt: new Date(),
            });
          }
        }
      }

      return vulnerabilities;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to check package security for ${packageName}:`,
        error
      );
      return [];
    }
  }

  private async alertOnCriticalVulnerabilities(
    report: SecurityReport
  ): Promise<void> {
    const criticalCount = report.criticalVulnerabilities.length;

    if (criticalCount > 0) {
      this.logger.error(
        `🚨 CRITICAL SECURITY ALERT: Found ${criticalCount} critical vulnerabilities!`
      );

      report.criticalVulnerabilities.forEach((vuln) => {
        this.logger.error(
          `Critical: ${vuln.package} - ${vuln.title} (Fixed in: ${vuln.fixedIn || 'N/A'})`
        );
      });
    }
  }
}
