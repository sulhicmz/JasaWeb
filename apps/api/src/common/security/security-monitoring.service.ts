import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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

// Define allowed paths for security
const ALLOWED_PATHS = [path.join(process.cwd(), 'security-reports')];

function isValidPath(filePath: string): boolean {
  return ALLOWED_PATHS.some((allowedPath) => filePath.startsWith(allowedPath));
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly reportsPath = path.join(process.cwd(), 'security-reports');

  constructor() {
    this.ensureReportsDirectory();
  }

  private ensureReportsDirectory() {
    if (!isValidPath(this.reportsPath)) {
      throw new Error('Invalid reports path detected');
    }
    if (!fs.existsSync(this.reportsPath)) {
      fs.mkdirSync(this.reportsPath, { recursive: true, mode: 0o750 });
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
      const auditOutput = execSync('pnpm audit --json', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return auditOutput;
    } catch (error) {
      // pnpm audit returns non-zero exit code when vulnerabilities are found
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
            severity?: string;
            title?: string;
            url?: string;
            patched_versions?: string;
            fixAvailable?: { version?: string };
          };
          const vulnerability: VulnerabilityAlert = {
            severity:
              (vuln.severity as 'critical' | 'high' | 'moderate' | 'low') ||
              'unknown',
            package: packageName,
            title: vuln.title || 'Unknown vulnerability',
            url: vuln.url,
            fixedIn: vuln.patched_versions,
            recommendation: this.generatePackageRecommendation(
              packageName,
              vuln
            ),
            detectedAt: new Date(),
          };
          vulnerabilities.push(vulnerability);
        }
      }

      return vulnerabilities;
    } catch (error: unknown) {
      this.logger.error('Failed to parse audit results:', error);
      return [];
    }
  }

  private generatePackageRecommendation(
    packageName: string,
    vulnData: { severity?: string; fixAvailable?: { version?: string } }
  ): string {
    if (vulnData.fixAvailable?.version) {
      return `Update ${packageName} to version ${vulnData.fixAvailable.version}`;
    }

    if (vulnData.severity === 'critical') {
      return `Immediate action required for ${packageName} - check alternative packages`;
    }

    return `Review ${packageName} for alternatives or patches`;
  }

  private async generateSecurityReport(): Promise<SecurityReport> {
    const auditOutput = await this.runVulnerabilityAudit();
    const vulnerabilities = this.parseAuditResults(auditOutput);

    const reportId = `report-${Date.now()}`;
    const severityBreakdown: Record<string, number> = {};

    vulnerabilities.forEach((vuln) => {
      severityBreakdown[vuln.severity] =
        (severityBreakdown[vuln.severity] || 0) + 1;
    });

    return {
      id: reportId,
      timestamp: new Date(),
      totalVulnerabilities: vulnerabilities.length,
      severityBreakdown,
      criticalVulnerabilities: vulnerabilities.filter(
        (v) => v.severity === 'critical'
      ),
      highVulnerabilities: vulnerabilities.filter((v) => v.severity === 'high'),
      moderateVulnerabilities: vulnerabilities.filter(
        (v) => v.severity === 'moderate'
      ),
      recommendations: this.generateOverallRecommendations(vulnerabilities),
    };
  }

  private generateOverallRecommendations(
    vulnerabilities: VulnerabilityAlert[]
  ): string[] {
    const recommendations: string[] = [];
    const criticalCount = vulnerabilities.filter(
      (v) => v.severity === 'critical'
    ).length;
    const highCount = vulnerabilities.filter(
      (v) => v.severity === 'high'
    ).length;

    if (criticalCount > 0) {
      recommendations.push(
        `Immediate attention required: ${criticalCount} critical vulnerabilities`
      );
    }

    if (highCount > 0) {
      recommendations.push(
        `High priority: ${highCount} high severity vulnerabilities to address`
      );
    }

    recommendations.push('Regular dependency updates recommended');
    recommendations.push('Consider implementing automated security scanning');

    return recommendations;
  }

  async saveReport(report: SecurityReport): Promise<void> {
    const filename = `security-report-${report.id}.json`;
    const filepath = path.join(this.reportsPath, filename);

    try {
      if (!isValidPath(filepath)) {
        throw new Error('Invalid file path for saving report');
      }
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2), {
        mode: 0o640,
      });
      this.logger.log(`Security report saved: ${filename}`);
    } catch (error: unknown) {
      this.logger.error('Failed to save security report:', error);
    }
  }

  private async alertOnCriticalVulnerabilities(
    report: SecurityReport
  ): Promise<void> {
    const criticalCount = report.criticalVulnerabilities.length;
    const highCount = report.highVulnerabilities.length;

    if (criticalCount > 0 || highCount > 0) {
      this.logger.warn(
        `🚨 SECURITY ALERT: ${criticalCount} critical and ${highCount} high vulnerabilities detected`
      );

      // Log critical vulnerabilities for immediate attention
      report.criticalVulnerabilities.forEach((vuln) => {
        this.logger.error(
          `CRITICAL: ${vuln.package} - ${vuln.title} | Fix: ${vuln.recommendation}`
        );
      });

      report.highVulnerabilities.forEach((vuln) => {
        this.logger.warn(
          `HIGH: ${vuln.package} - ${vuln.title} | Fix: ${vuln.recommendation}`
        );
      });
    }
  }

  async getLatestReport(): Promise<SecurityReport | null> {
    try {
      if (!isValidPath(this.reportsPath)) {
        throw new Error('Invalid reports path for getLatestReport');
      }

      const files = fs
        .readdirSync(this.reportsPath, { encoding: 'utf8' })
        .filter(
          (file) =>
            file.startsWith('security-report-') && file.endsWith('.json')
        )
        .sort()
        .reverse();

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[0];
      const filepath = path.join(this.reportsPath, latestFile!);

      if (!isValidPath(filepath)) {
        throw new Error('Invalid file path detected');
      }

      const fileContent = fs.readFileSync(filepath, 'utf-8');

      return JSON.parse(fileContent);
    } catch (error) {
      this.logger.error('Failed to retrieve latest security report:', error);
      return null;
    }
  }

  async checkPackageSecurity(
    packageName: string
  ): Promise<VulnerabilityAlert[]> {
    try {
      this.logger.log(`Checking security for package: ${packageName}`);

      const auditOutput = execSync(
        `pnpm audit --json --filter ${packageName}`,
        {
          cwd: process.cwd(),
          encoding: 'utf-8',
          stdio: 'pipe',
        }
      );

      const allVulnerabilities = this.parseAuditResults(auditOutput);
      const packageVulnerabilities = allVulnerabilities.filter(
        (vuln) => vuln.package === packageName
      );

      this.logger.log(
        `Found ${packageVulnerabilities.length} vulnerabilities for ${packageName}`
      );

      return packageVulnerabilities;
    } catch (error) {
      this.logger.error(
        `Failed to check package security for ${packageName}:`,
        error
      );
      return [];
    }
  }

  async getReportHistory(limit: number = 10): Promise<SecurityReport[]> {
    try {
      if (!isValidPath(this.reportsPath)) {
        throw new Error('Invalid reports path for getReportHistory');
      }

      const files = fs
        .readdirSync(this.reportsPath, { encoding: 'utf8' })
        .filter(
          (file) =>
            file.startsWith('security-report-') && file.endsWith('.json')
        )
        .sort()
        .reverse()
        .slice(0, limit);

      const reports: SecurityReport[] = [];

      for (const file of files) {
        try {
          const filepath = path.join(this.reportsPath, file);

          if (!isValidPath(filepath)) {
            this.logger.warn(`Skipping invalid file path: ${filepath}`);
            continue;
          }

          const fileContent = fs.readFileSync(filepath, { encoding: 'utf-8' });
          const report = JSON.parse(fileContent);
          reports.push(report);
        } catch (error) {
          this.logger.error(`Failed to parse report file ${file}:`, error);
        }
      }

      return reports;
    } catch (error) {
      this.logger.error('Failed to retrieve report history:', error);
      return [];
    }
  }
}
