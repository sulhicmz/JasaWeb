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

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly reportsPath = path.join(process.cwd(), 'security-reports');

  constructor() {
    this.ensureReportsDirectory();
  }

  private ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsPath)) {
      fs.mkdirSync(this.reportsPath, { recursive: true });
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

  async generateSecurityReport(): Promise<SecurityReport> {
    const auditOutput = await this.runSecurityAudit();
    const vulnerabilities = this.parseAuditResults(auditOutput);

    const criticalVulns = vulnerabilities.filter(
      (v) => v.severity === 'critical'
    );
    const highVulns = vulnerabilities.filter((v) => v.severity === 'high');
    const moderateVulns = vulnerabilities.filter(
      (v) => v.severity === 'moderate'
    );

    return {
      id: `security-${Date.now()}`,
      timestamp: new Date(),
      totalVulnerabilities: vulnerabilities.length,
      severityBreakdown: this.calculateSeverityBreakdown(vulnerabilities),
      criticalVulnerabilities: criticalVulns,
      highVulnerabilities: highVulns,
      moderateVulnerabilities: moderateVulns,
      recommendations: this.generateRecommendations(vulnerabilities),
    };
  }

  private async runSecurityAudit(): Promise<string> {
    try {
      // Use pnpm for audit since it's the package manager for this project
      const auditOutput = execSync('pnpm audit --json', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return auditOutput;
    } catch (error) {
      // pnpm audit returns non-zero exit code when vulnerabilities are found
      // We still want to get the output in that case
      const errorWithStdout = error as any;
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
          const vuln = vulnData as any;
          const vulnerability: VulnerabilityAlert = {
            severity: vuln.severity || 'unknown',
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
    } catch (error: any) {
      this.logger.error('Failed to parse audit results:', error);
      return [];
    }
  }

  private generatePackageRecommendation(
    packageName: string,
    vulnData: any
  ): string {
    if (vulnData.fixAvailable && vulnData.fixAvailable.version) {
      return `Upgrade ${packageName} to ${vulnData.fixAvailable.version}`;
    } else if (vulnData.patched_versions) {
      return `Update ${packageName} to a patched version: ${vulnData.patched_versions}`;
    } else {
      return `Monitor ${packageName} for security updates. Consider alternatives if no fix is available.`;
    }
  }

  private calculateSeverityBreakdown(
    vulnerabilities: VulnerabilityAlert[]
  ): Record<string, number> {
    return vulnerabilities.reduce((acc: Record<string, number>, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {});
  }

  private generateRecommendations(
    vulnerabilities: VulnerabilityAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Critical vulnerabilities
    const criticalCount = vulnerabilities.filter(
      (v) => v.severity === 'critical'
    ).length;
    if (criticalCount > 0) {
      recommendations.push(
        `URGENT: Fix ${criticalCount} critical vulnerabilities immediately`
      );
    }

    // High vulnerabilities
    const highCount = vulnerabilities.filter(
      (v) => v.severity === 'high'
    ).length;
    if (highCount > 0) {
      recommendations.push(
        `HIGH: Address ${highCount} high-severity vulnerabilities within 7 days`
      );
    }

    // Moderate vulnerabilities
    const moderateCount = vulnerabilities.filter(
      (v) => v.severity === 'moderate'
    ).length;
    if (moderateCount > 0) {
      recommendations.push(
        `MODERATE: Review and fix ${moderateCount} moderate vulnerabilities in the next sprint`
      );
    }

    // Dependency updates
    recommendations.push(
      'Implement automated dependency updates in CI/CD pipeline'
    );
    recommendations.push(
      'Add automated security scanning to pull request checks'
    );
    recommendations.push(
      'Consider using Dependabot for automatic dependency management'
    );

    return recommendations;
  }

  private async saveReport(report: SecurityReport): Promise<void> {
    const filename = `security-report-${report.id}.json`;
    const filepath = path.join(this.reportsPath, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      this.logger.log(`Security report saved: ${filename}`);
    } catch (error: any) {
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

      // In a real implementation, this would trigger:
      // - Email notifications
      // - Slack/Discord alerts
      // - PagerDuty incidents for critical issues
      // - JIRA ticket creation
    }
  }

  async getLatestReport(): Promise<SecurityReport | null> {
    try {
      const files = fs
        .readdirSync(this.reportsPath)
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
      const fileContent = fs.readFileSync(filepath, 'utf-8');

      return JSON.parse(fileContent);
    } catch (error) {
      this.logger.error('Failed to retrieve latest security report:', error);
      return null;
    }
  }

  async getReportHistory(limit: number = 10): Promise<SecurityReport[]> {
    try {
      const files = fs
        .readdirSync(this.reportsPath)
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
          const fileContent = fs.readFileSync(filepath, 'utf-8');
          const report = JSON.parse(fileContent);
          reports.push(report);
        } catch (error) {
          this.logger.warn(`Failed to parse report file ${file}:`, error);
        }
      }

      return reports;
    } catch (error) {
      this.logger.error('Failed to retrieve security report history:', error);
      return [];
    }
  }

  async checkPackageSecurity(
    packageName: string
  ): Promise<VulnerabilityAlert[]> {
    try {
      const auditOutput = execSync(
        `pnpm audit --json --filter ${packageName}`,
        {
          encoding: 'utf-8',
          stdio: 'pipe',
        }
      );

      const vulnerabilities = this.parseAuditResults(auditOutput);
      return vulnerabilities.filter((v) => v.package === packageName);
    } catch (error) {
      this.logger.error(
        `Failed to check security for package ${packageName}:`,
        error
      );
      return [];
    }
  }
}
