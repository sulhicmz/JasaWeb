import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { join } from 'path';
import { promises as fs } from 'fs';

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
  private readonly reportsPath = join(process.cwd(), 'security-reports');

  constructor() {
    this.ensureReportsDirectory();
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      // Path is constructed from controlled process.cwd() and constant string
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.mkdir(this.reportsPath, { recursive: true });
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

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      // Path is constructed from controlled reportsPath and sanitized filename
      // eslint-disable-next-line security/detect-non-literal-fs-filename
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
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      // Path is controlled constant from process.cwd() and constant string
      const files = // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.readdir(this.reportsPath);
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
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      // Path is constructed from controlled reportsPath and filtered array result
      const content = // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.readFile(
        join(this.reportsPath, latestFile || 'default.json'),
        'utf8'
      );
      return JSON.parse(content) as SecurityReport;
    } catch (error: unknown) {
      this.logger.error('Failed to get latest security report:', error);
      return null;
    }
  }

  async getReportHistory(limit: number = 10): Promise<SecurityReport[]> {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      // Path is controlled constant from process.cwd() and constant string
      const files = // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.readdir(this.reportsPath);
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
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          // Path is constructed from controlled reportsPath and filtered array result
          const content = // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.readFile(
            join(this.reportsPath, file),
            'utf8'
          );
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
