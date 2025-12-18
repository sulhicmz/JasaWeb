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
    const validPath = path.join(process.cwd(), 'security-reports');
    if (!isValidPath(validPath)) {
      throw new Error('Invalid reports path detected');
    }
    const normalizedPath = path.normalize(validPath);
    if (!isValidPath(normalizedPath)) {
      throw new Error('Invalid normalized reports path detected');
    }
    try {
      if (!fs.existsSync(normalizedPath)) {
        fs.mkdirSync(normalizedPath, { recursive: true, mode: 0o750 });
      }
    } catch (error) {
      throw new Error(
        `Failed to create reports directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
    // Sanitize report ID to prevent path traversal
    const sanitizedId = report.id.replace(/[^a-zA-Z0-9\-_]/g, '');
    const filename = `security-report-${sanitizedId}.json`;
    const filepath = path.join(this.reportsPath, filename);
    const normalizedPath = path.normalize(filepath);

    try {
      if (!isValidPath(normalizedPath)) {
        throw new Error('Invalid file path for saving report');
      }
      // Ensure file stays within allowed directory
      if (!normalizedPath.startsWith(path.normalize(this.reportsPath))) {
        throw new Error('File path traversal attempt detected');
      }
      fs.writeFileSync(normalizedPath, JSON.stringify(report, null, 2), {
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

      const normalizedReportsPath = path.normalize(this.reportsPath);
      if (!isValidPath(normalizedReportsPath)) {
        throw new Error('Invalid normalized reports path');
      }

      const validFiles = fs.readdirSync(normalizedReportsPath, {
        encoding: 'utf8',
      });
      const files = validFiles
        .filter((file): file is string => {
          // Validate file name to prevent injection
          return (
            typeof file === 'string' &&
            /^[a-zA-Z0-9-._]+$/.test(file) &&
            file.startsWith('security-report-') &&
            file.endsWith('.json')
          );
        })
        .sort()
        .reverse();

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[0];
      if (!latestFile) {
        return null;
      }
      const filepath = path.join(normalizedReportsPath, latestFile);
      const normalizedFilepath = path.normalize(filepath);

      if (!isValidPath(normalizedFilepath)) {
        throw new Error('Invalid file path detected');
      }

      // Ensure file stays within allowed directory
      if (!normalizedFilepath.startsWith(normalizedReportsPath)) {
        throw new Error('File path traversal attempt detected');
      }

      const fileContent = fs.readFileSync(normalizedFilepath, 'utf-8');

      // Safe JSON parsing with validation
      const parsed = JSON.parse(fileContent);
      return this.validateSecurityReport(parsed);
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

      const normalizedReportsPath = path.normalize(this.reportsPath);
      if (!isValidPath(normalizedReportsPath)) {
        throw new Error('Invalid normalized reports path');
      }

      const validFiles = fs.readdirSync(normalizedReportsPath, {
        encoding: 'utf8',
      });
      const files = validFiles
        .filter((file): file is string => {
          // Validate file name to prevent injection
          return (
            typeof file === 'string' &&
            /^[a-zA-Z0-9-._]+$/.test(file) &&
            file.startsWith('security-report-') &&
            file.endsWith('.json')
          );
        })
        .sort()
        .reverse()
        .slice(0, limit);

      const reports: SecurityReport[] = [];

      for (const file of files) {
        try {
          const filepath = path.join(normalizedReportsPath, file);
          const normalizedFilepath = path.normalize(filepath);

          if (!isValidPath(normalizedFilepath)) {
            this.logger.warn(
              `Skipping invalid file path: ${normalizedFilepath}`
            );
            continue;
          }

          // Ensure file stays within allowed directory
          if (!normalizedFilepath.startsWith(normalizedReportsPath)) {
            this.logger.warn(
              `Skipping file outside allowed directory: ${file}`
            );
            continue;
          }

          const fileContent = fs.readFileSync(normalizedFilepath, {
            encoding: 'utf-8',
          });
          const parsed = JSON.parse(fileContent);
          const validatedReport = this.validateSecurityReport(parsed);
          reports.push(validatedReport);
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

  private validateSecurityReport(data: unknown): SecurityReport {
    // Create safe object with null prototype to prevent prototype pollution
    const report = Object.create(null) as SecurityReport;

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid security report data');
    }

    const obj = data as Record<string, unknown>;

    // Validate and safely assign properties
    report.id = typeof obj.id === 'string' ? obj.id : 'unknown';
    report.timestamp = new Date((obj.timestamp as string) || Date.now());
    report.totalVulnerabilities =
      typeof obj.totalVulnerabilities === 'number'
        ? obj.totalVulnerabilities
        : 0;
    report.severityBreakdown = this.validateSeverityBreakdown(
      obj.severityBreakdown
    );
    report.criticalVulnerabilities = this.validateVulnerabilityArray(
      obj.criticalVulnerabilities
    );
    report.highVulnerabilities = this.validateVulnerabilityArray(
      obj.highVulnerabilities
    );
    report.moderateVulnerabilities = this.validateVulnerabilityArray(
      obj.moderateVulnerabilities
    );
    report.recommendations = this.validateRecommendations(obj.recommendations);

    return report;
  }

  private validateSeverityBreakdown(data: unknown): Record<string, number> {
    const breakdown = Object.create(null) as Record<string, number>;

    if (!data || typeof data !== 'object') {
      return breakdown;
    }

    // Use Map for safe key iteration
    const keys = Object.keys(data as Record<string, unknown>);
    const forbiddenKeys = new Set(['__proto__', 'constructor', 'prototype']);
    for (const key of keys) {
      if (
        typeof key === 'string' &&
        /^[a-zA-Z0-9_-]+$/.test(key) && // Only allow safe characters
        !forbiddenKeys.has(key) // Prevent prototype pollution
      ) {
        const value = (data as Record<string, unknown>)[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
          Object.defineProperty(breakdown, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }
    }

    return breakdown;
  }

  private validateVulnerabilityArray(data: unknown): VulnerabilityAlert[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter((item): item is VulnerabilityAlert => {
      if (!item || typeof item !== 'object') return false;

      const vuln = item as Record<string, unknown>;
      return (
        typeof vuln.package === 'string' &&
        typeof vuln.severity === 'string' &&
        ['critical', 'high', 'moderate', 'low'].includes(vuln.severity)
      );
    });
  }

  private validateRecommendations(data: unknown): string[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter((item): item is string => typeof item === 'string');
  }
}
