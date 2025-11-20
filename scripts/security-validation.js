#!/usr/bin/env node

/**
 * Security Validation Script for JasaWeb
 *
 * This script performs security checks on the codebase to identify
 * potential vulnerabilities and security anti-patterns.
 */

const fs = require('fs');
const path = require('path');

class SecurityValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.baseDir = process.cwd();
  }

  // Check for hardcoded secrets in configuration files
  checkHardcodedSecrets() {
    console.log('🔍 Checking for hardcoded secrets...');

    const secretPatterns = [
      /password\s*=\s*['"](?!(change|example|test))/i,
      /secret\s*=\s*['"](?!(change|example|test))/i,
      /key\s*=\s*['"](?!(change|example|test))/i,
      /token\s*=\s*['"](?!(change|example|test))/i,
    ];

    const configFiles = [
      '.env',
      '.env.example',
      'apps/api/.env',
      'apps/api/.env.example',
      'apps/web/.env',
      'apps/web/.env.example',
    ];

    configFiles.forEach((file) => {
      const filePath = path.join(this.baseDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        secretPatterns.forEach((pattern, index) => {
          if (pattern.test(content)) {
            this.issues.push({
              type: 'HARDCODED_SECRET',
              file: file,
              message: `Potential hardcoded secret detected in ${file}`,
              severity: 'HIGH',
            });
          }
        });
      }
    });
  }

  // Check for insecure dependencies
  checkInsecureDependencies() {
    console.log('🔍 Checking for insecure dependencies...');

    const packageFiles = [
      'package.json',
      'apps/api/package.json',
      'apps/web/package.json',
      'packages/ui/package.json',
      'packages/config/package.json',
    ];

    const knownVulnerablePackages = [
      'lodash',
      'request',
      'axios',
      'moment',
      'node-forge',
    ];

    packageFiles.forEach((file) => {
      const filePath = path.join(this.baseDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const pkg = JSON.parse(content);

        if (pkg.dependencies) {
          Object.keys(pkg.dependencies).forEach((dep) => {
            if (knownVulnerablePackages.includes(dep)) {
              this.warnings.push({
                type: 'POTENTIALLY_VULNERABLE_DEPENDENCY',
                file: file,
                dependency: dep,
                version: pkg.dependencies[dep],
                message: `Package ${dep} may have known vulnerabilities`,
                severity: 'MEDIUM',
              });
            }
          });
        }
      }
    });
  }

  // Check for console statements in production code
  checkConsoleStatements() {
    console.log('🔍 Checking for console statements...');

    const sourceDirs = ['apps/api/src', 'apps/web/src', 'packages/ui/src'];

    const consolePatterns = [
      /console\.log/,
      /console\.warn/,
      /console\.error/,
      /console\.debug/,
    ];

    sourceDirs.forEach((dir) => {
      const fullPath = path.join(this.baseDir, dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath, (filePath) => {
          if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf8');

            consolePatterns.forEach((pattern, index) => {
              const lines = content.split('\n');
              lines.forEach((line, lineNum) => {
                if (
                  pattern.test(line) &&
                  !line.includes('// TODO: remove console')
                ) {
                  this.warnings.push({
                    type: 'CONSOLE_STATEMENT',
                    file: path.relative(this.baseDir, filePath),
                    line: lineNum + 1,
                    message: `Console statement found at line ${lineNum + 1}`,
                    severity: 'LOW',
                  });
                }
              });
            });
          }
        });
      }
    });
  }

  // Check for TypeScript any types
  checkAnyTypes() {
    console.log('🔍 Checking for TypeScript any types...');

    const sourceDirs = ['apps/api/src', 'packages/ui/src'];

    sourceDirs.forEach((dir) => {
      const fullPath = path.join(this.baseDir, dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath, (filePath) => {
          if (filePath.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');

            const lines = content.split('\n');
            lines.forEach((line, lineNum) => {
              if (
                /: any\b/.test(line) &&
                !line.includes('// TODO: add proper type')
              ) {
                this.warnings.push({
                  type: 'TYPESCRIPT_ANY_TYPE',
                  file: path.relative(this.baseDir, filePath),
                  line: lineNum + 1,
                  message: `TypeScript 'any' type found at line ${lineNum + 1}`,
                  severity: 'LOW',
                });
              }
            });
          }
        });
      }
    });
  }

  // Check for proper error handling
  checkErrorHandling() {
    console.log('🔍 Checking for error handling...');

    const sourceDirs = ['apps/api/src'];

    sourceDirs.forEach((dir) => {
      const fullPath = path.join(this.baseDir, dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath, (filePath) => {
          if (filePath.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Check for try-catch blocks
            const tryBlocks = content.match(/try\s*{[^}]*}/gs) || [];
            const catchBlocks =
              content.match(/catch\s*\([^)]*\)\s*{[^}]*}/gs) || [];

            if (tryBlocks.length > catchBlocks.length) {
              this.warnings.push({
                type: 'MISSING_ERROR_HANDLING',
                file: path.relative(this.baseDir, filePath),
                message: `Potential missing error handling in try-catch blocks`,
                severity: 'MEDIUM',
              });
            }
          }
        });
      }
    });
  }

  // Helper method to scan directory recursively
  scanDirectory(dir, callback) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.scanDirectory(filePath, callback);
      } else {
        callback(filePath);
      }
    });
  }

  // Generate security report
  generateReport() {
    console.log('\n📊 Security Validation Report');
    console.log('================================');

    const highIssues = this.issues.filter((i) => i.severity === 'HIGH');
    const mediumIssues = [
      ...this.issues.filter((i) => i.severity === 'MEDIUM'),
      ...this.warnings.filter((w) => w.severity === 'MEDIUM'),
    ];
    const lowIssues = this.warnings.filter((w) => w.severity === 'LOW');

    if (highIssues.length > 0) {
      console.log(`\n🚨 HIGH SEVERITY ISSUES (${highIssues.length}):`);
      highIssues.forEach((issue) => {
        console.log(`  ❌ ${issue.message}`);
        if (issue.file) console.log(`     File: ${issue.file}`);
        if (issue.line) console.log(`     Line: ${issue.line}`);
      });
    }

    if (mediumIssues.length > 0) {
      console.log(`\n⚠️  MEDIUM SEVERITY ISSUES (${mediumIssues.length}):`);
      mediumIssues.forEach((issue) => {
        console.log(`  ⚠️  ${issue.message}`);
        if (issue.file) console.log(`     File: ${issue.file}`);
        if (issue.line) console.log(`     Line: ${issue.line}`);
      });
    }

    if (lowIssues.length > 0) {
      console.log(`\n💡 LOW SEVERITY ISSUES (${lowIssues.length}):`);
      lowIssues.forEach((issue) => {
        console.log(`  💡 ${issue.message}`);
        if (issue.file) console.log(`     File: ${issue.file}`);
        if (issue.line) console.log(`     Line: ${issue.line}`);
      });
    }

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ No security issues found!');
    }

    console.log('\n📈 Summary:');
    console.log(`  High Severity: ${highIssues.length}`);
    console.log(`  Medium Severity: ${mediumIssues.length}`);
    console.log(`  Low Severity: ${lowIssues.length}`);
    console.log(`  Total Issues: ${this.issues.length + this.warnings.length}`);

    // Exit with error code if high severity issues found
    if (highIssues.length > 0) {
      process.exit(1);
    }
  }

  // Run all security checks
  run() {
    console.log('🛡️  Starting Security Validation...\n');

    this.checkHardcodedSecrets();
    this.checkInsecureDependencies();
    this.checkConsoleStatements();
    this.checkAnyTypes();
    this.checkErrorHandling();

    this.generateReport();
  }
}

// Run the security validator
if (require.main === module) {
  const validator = new SecurityValidator();
  validator.run();
}

module.exports = SecurityValidator;
