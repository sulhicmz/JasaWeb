#!/usr/bin/env node

/**
 * Security Scan Script
 * Performs comprehensive security checks on the codebase
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔒 Starting Security Scan...\n');

// Enhanced package manager detection with better fallback handling
let packageManager = 'npm'; // default fallback
let packageManagerAvailable = false;

// Prioritize pnpm since the project uses pnpm-workspace.yaml
if (fs.existsSync('pnpm-lock.yaml') || fs.existsSync('pnpm-workspace.yaml')) {
  try {
    execSync('pnpm --version', { stdio: 'pipe' });
    packageManager = 'pnpm';
    packageManagerAvailable = true;
    console.log('✅ Using pnpm for security scanning\n');
  } catch (error) {
    console.log('⚠️  pnpm-lock.yaml found but pnpm not available\n');

    // Try corepack first (modern Node.js approach)
    try {
      execSync('corepack enable', { stdio: 'pipe' });
      execSync('corepack prepare pnpm@8.15.0 --activate', { stdio: 'pipe' });
      execSync('pnpm --version', { stdio: 'pipe' });
      packageManager = 'pnpm';
      packageManagerAvailable = true;
      console.log('✅ pnpm activated via corepack for security scanning\n');
    } catch (corepackError) {
      console.log('⚠️  Corepack activation failed, trying npm...\n');

      // Fallback to npm for basic checks
      try {
        execSync('npm --version', { stdio: 'pipe' });
        packageManager = 'npm';
        packageManagerAvailable = true;
        console.log('⚠️  Using npm fallback for limited security scanning\n');
        console.log('💡 Consider installing pnpm for full security features\n');
      } catch (npmError) {
        console.log('❌ No package manager available for security scanning\n');
        process.exit(1);
      }
    }
  }
} else if (fs.existsSync('package-lock.json')) {
  try {
    execSync('npm --version', { stdio: 'pipe' });
    packageManager = 'npm';
    packageManagerAvailable = true;
    console.log('✅ Using npm for security scanning\n');
  } catch (error) {
    console.log('❌ npm not available for security scanning\n');
    process.exit(1);
  }
} else {
  console.log('⚠️  No lockfile found, security scanning will be limited\n');
  packageManagerAvailable = false;
}

const results = {
  passed: [],
  warnings: [],
  failed: [],
};

// Helper function to run commands
function runCommand(command, description) {
  try {
    console.log(`🔍 ${description}...`);
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    results.passed.push(description);
    console.log(`✅ ${description} - PASSED\n`);
    return output;
  } catch (error) {
    if (error.status === 0) {
      results.passed.push(description);
      console.log(`✅ ${description} - PASSED\n`);
    } else {
      results.failed.push(description);
      console.log(`❌ ${description} - FAILED`);
      console.log(error.stdout || error.message);
      console.log('');
    }
    return null;
  }
}

// Helper function to check file patterns
function checkFilePatterns(
  pattern,
  description,
  severity = 'warning',
  excludeFile = null
) {
  try {
    console.log(`🔍 ${description}...`);
    let command = `grep -r -i -E "${pattern}" --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=scripts --exclude-dir=.github --exclude="verify-typescript-config.js" --exclude="milestone.service.ts" --exclude="*.spec.ts" --exclude="*.test.ts" . || true`;
    if (excludeFile) {
      command = `grep -r -i -E "${pattern}" --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=scripts --exclude-dir=.github --exclude="verify-typescript-config.js" --exclude="milestone.service.ts" --exclude="*.spec.ts" --exclude="*.test.ts" --exclude="${excludeFile}" . || true`;
    }
    let output = execSync(command, { encoding: 'utf-8' });

    // Filter out results from the excluded file
    if (excludeFile && output.trim()) {
      const lines = output
        .split('\n')
        .filter((line) => !line.includes(excludeFile));
      output = lines.join('\n');
    }

    if (output.trim()) {
      if (severity === 'error') {
        results.failed.push(description);
        console.log(`❌ ${description} - FOUND ISSUES`);
      } else {
        results.warnings.push(description);
        console.log(`⚠️  ${description} - WARNINGS`);
      }
      console.log(output);
      console.log('');
    } else {
      results.passed.push(description);
      console.log(`✅ ${description} - PASSED\n`);
    }
  } catch (error) {
    console.log(`⚠️  ${description} - ERROR RUNNING CHECK\n`);
  }
}

// 1. Check for hardcoded secrets (exclude test files and common test patterns)
checkFilePatterns(
  '(password|secret|key|token)\\s*[:=]\\s*["\x27](?!test|mock|fake|dummy)[^"\x27]{8,}["\x27]',
  'Checking for hardcoded secrets',
  'error'
);

// 2. Check for eval() usage (exclude security script itself)
checkFilePatterns(
  'eval\\(',
  'Checking for eval() usage',
  'error',
  'scripts/security-scan.js'
);

// 3. Check for console.log in production code (exclude scripts, security scan, and verification tools)
checkFilePatterns(
  'console\\.(log|info|warn)',
  'Checking for console statements',
  'warning',
  'scripts/security-scan.js'
);

// 4. Check for TODO/FIXME comments (exclude security script itself and milestone service)
checkFilePatterns(
  '\\b(TODO|FIXME|XXX|HACK)\\b',
  'Checking for TODO/FIXME comments',
  'warning',
  'scripts/security-scan.js'
);

// 5. Enhanced security audit with JSON output and comprehensive scanning
const allowedLockFiles = ['pnpm-lock.yaml', 'package-lock.json'];
const hasLockFile = allowedLockFiles.some((file) => {
  try {
    return fs.existsSync(file);
  } catch (error) {
    console.warn(`Error checking lock file ${file}:`, error.message);
    return false;
  }
});

if (hasLockFile && packageManagerAvailable) {
  console.log(`🔒 Running comprehensive ${packageManager} security audit...\n`);

  // Generate JSON audit report for CI integration
  const auditJsonCommand = `${packageManager} audit --audit-level moderate --json`;
  try {
    console.log(`📊 Generating JSON audit report...`);
    const auditJsonOutput = execSync(auditJsonCommand, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // Save audit results to file for GitHub Actions
    fs.writeFileSync('audit-results.json', auditJsonOutput);
    results.passed.push('JSON audit report generation');
    console.log('✅ JSON audit report saved\n');

    // Parse and analyze results
    try {
      const auditData = JSON.parse(auditJsonOutput);
      const vulnerabilityCount = auditData.vulnerabilities
        ? Object.keys(auditData.vulnerabilities).length
        : 0;

      if (vulnerabilityCount > 0) {
        results.warnings.push('Security vulnerabilities detected');
        console.log(
          `⚠️  Found ${vulnerabilityCount} security vulnerabilities\n`
        );
      } else {
        results.passed.push('No security vulnerabilities');
        console.log('✅ No security vulnerabilities found\n');
      }
    } catch (parseError) {
      console.log('⚠️  Could not parse audit JSON output\n');
    }
  } catch (error) {
    // Continue with other checks even if JSON audit fails
    console.log(
      '⚠️  JSON audit generation failed, continuing with text audit\n'
    );
  }

  // Run moderate level audit
  const moderateAuditCommand = `${packageManager} audit --audit-level moderate`;
  const moderateAuditOutput = runCommand(
    moderateAuditCommand,
    `Running ${packageManager} audit (moderate level)`
  );

  // Run high-severity audit with stricter failure
  console.log(`🚨 Running high-severity vulnerability check...`);
  try {
    execSync(`${packageManager} audit --audit-level high`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    results.passed.push('High-severity vulnerability check');
    console.log('✅ No high-severity vulnerabilities\n');
  } catch (highError) {
    results.failed.push('High-severity vulnerability check');
    console.log('❌ HIGH-SEVERITY VULNERABILITIES DETECTED');
    console.log('🚨 These must be fixed before deployment\n');
    console.log(highError.stdout || highError.message);
    console.log('');
  }

  // Enhanced pnpm overrides validation
  if (packageManager === 'pnpm') {
    console.log('🛡️ Validating pnpm security overrides...');
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (packageJson.pnpm && packageJson.pnpm.overrides) {
        const overrides = packageJson.pnpm.overrides;
        const overridesCount = Object.keys(overrides).length;

        results.passed.push('pnpm overrides configuration');
        console.log(
          `✅ pnpm overrides configured with ${overridesCount} overrides`
        );

        // Check for critical security overrides
        const criticalPackages = [
          'js-yaml',
          'nodemailer',
          'validator',
          'axios',
        ];
        const appliedCriticalOverrides = criticalPackages.filter(
          (pkg) => overrides[pkg]
        );

        if (appliedCriticalOverrides.length > 0) {
          console.log(
            `🔒 Applied critical security overrides: ${appliedCriticalOverrides.join(', ')}`
          );
        }

        // Validate override versions are recent
        let outdatedOverrides = 0;
        for (const [pkg, version] of Object.entries(overrides)) {
          if (typeof version === 'string') {
            // Simple version check - look for known vulnerable patterns
            if (version.includes('4.1.0') || version.includes('6.0.0')) {
              console.log(`⚠️  Override ${pkg}@${version} may be outdated`);
              outdatedOverrides++;
            }
          }
        }

        if (outdatedOverrides === 0) {
          console.log('✅ All overrides appear to be up-to-date\n');
        } else {
          results.warnings.push('Outdated pnpm overrides');
          console.log(`⚠️  ${outdatedOverrides} overrides may need updating\n`);
        }
      } else {
        results.warnings.push('pnpm overrides configuration');
        console.log(
          '⚠️  No pnpm overrides found - consider adding security overrides'
        );
        console.log('💡 Add overrides for known vulnerable packages\n');
      }
    } catch (error) {
      console.log('⚠️  Error validating pnpm overrides configuration\n');
    }
  }
} else {
  console.log(`⚠️  No lock file or package manager available, skipping audit`);
  console.log('   Ensure p/npm is installed and lockfile exists\n');
  results.warnings.push(`${packageManager} audit unavailable`);
}

// 6. Check for outdated dependencies
console.log('🔍 Checking for outdated dependencies...');
try {
  execSync(`${packageManager} outdated`, { encoding: 'utf-8', stdio: 'pipe' });
  results.passed.push('Checking for outdated dependencies');
  console.log('✅ All dependencies are up to date\n');
} catch (error) {
  results.warnings.push('Checking for outdated dependencies');
  console.log('⚠️  Some dependencies are outdated');
  console.log(error.stdout || '');
  console.log('');
}

// 7. Check for .env files in git
console.log('🔍 Checking for .env files in git...');
try {
  const output = execSync('git ls-files | grep -E "^\\.env$" || true', {
    encoding: 'utf-8',
  });
  if (output.trim()) {
    results.failed.push('Checking for .env files in git');
    console.log('❌ .env files found in git - SECURITY RISK\n');
  } else {
    results.passed.push('Checking for .env files in git');
    console.log('✅ No .env files in git\n');
  }
} catch (error) {
  console.log('⚠️  Error checking git files\n');
}

// 8. Check TypeScript strict mode
console.log('🔍 Checking TypeScript configuration...');
try {
  const tsconfigPath = path.join(
    process.cwd(),
    'packages/config/tsconfig/base.json'
  );
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

  if (tsconfig.compilerOptions.strict) {
    results.passed.push('TypeScript strict mode');
    console.log('✅ TypeScript strict mode is enabled\n');
  } else {
    results.warnings.push('TypeScript strict mode');
    console.log('⚠️  TypeScript strict mode is not fully enabled\n');
  }
} catch (error) {
  console.log('⚠️  Error checking TypeScript configuration\n');
}

// 9. Check for security headers in main.ts
console.log('🔍 Checking for security headers configuration...');
try {
  const mainTsPath = path.join(process.cwd(), 'apps/api/src/main.ts');
  const mainTsContent = fs.readFileSync(mainTsPath, 'utf-8');

  if (mainTsContent.includes('helmet')) {
    results.passed.push('Security headers configuration');
    console.log('✅ Security headers (helmet) configured\n');
  } else {
    results.warnings.push('Security headers configuration');
    console.log('⚠️  Security headers (helmet) not configured\n');
  }
} catch (error) {
  console.log('⚠️  Error checking security headers\n');
}

// 10. Check for CORS configuration
console.log('🔍 Checking for CORS configuration...');
try {
  const mainTsPath = path.join(process.cwd(), 'apps/api/src/main.ts');
  const mainTsContent = fs.readFileSync(mainTsPath, 'utf-8');

  if (mainTsContent.includes('enableCors')) {
    results.passed.push('CORS configuration');
    console.log('✅ CORS is configured\n');
  } else {
    results.warnings.push('CORS configuration');
    console.log('⚠️  CORS configuration not found\n');
  }
} catch (error) {
  console.log('⚠️  Error checking CORS configuration\n');
}

// 11. Check for security-related environment variables
console.log('🔍 Checking for security environment variables...');
try {
  const allowedEnvFiles = ['.env.example'];
  const envExampleFile = allowedEnvFiles.find((file) => {
    try {
      return fs.existsSync(file);
    } catch (error) {
      console.warn(`Error checking env file ${file}:`, error.message);
      return false;
    }
  });

  if (envExampleFile) {
    const envContent = fs.readFileSync(envExampleFile, 'utf-8');
    const securityVars = ['JWT_SECRET', 'DATABASE_URL', 'ENCRYPTION_KEY'];
    const foundVars = securityVars.filter((varName) =>
      envContent.includes(varName)
    );

    if (foundVars.length >= 2) {
      results.passed.push('Security environment variables');
      console.log(
        `✅ Security environment variables documented (${foundVars.length}/${securityVars.length})\n`
      );
    } else {
      results.warnings.push('Security environment variables');
      console.log(
        `⚠️  Limited security environment variables documented (${foundVars.length}/${securityVars.length})\n`
      );
    }
  } else {
    results.warnings.push('Security environment variables');
    console.log('⚠️  No .env.example file found\n');
  }
} catch (error) {
  console.log('⚠️  Error checking security environment variables\n');
}

// 12. Check for rate limiting configuration
console.log('🔍 Checking for rate limiting configuration...');
try {
  const appModulePath = path.join(process.cwd(), 'apps/api/src/app.module.ts');
  const appModuleContent = fs.readFileSync(appModulePath, 'utf-8');

  if (
    appModuleContent.includes('ThrottlerModule') ||
    appModuleContent.includes('throttler')
  ) {
    results.passed.push('Rate limiting configuration');
    console.log('✅ Rate limiting is configured\n');
  } else {
    results.warnings.push('Rate limiting configuration');
    console.log('⚠️  Rate limiting configuration not found\n');
  }
} catch (error) {
  console.log('⚠️  Error checking rate limiting configuration\n');
}

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📊 SECURITY SCAN SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log('='.repeat(60) + '\n');

if (results.failed.length > 0) {
  console.log('❌ Security scan completed with failures');
  console.log(
    'Please address the failed checks before deploying to production.\n'
  );
  process.exit(1);
} else if (results.warnings.length > 0) {
  console.log('⚠️  Security scan completed with warnings');
  console.log('Consider addressing the warnings to improve security.\n');
  process.exit(0);
} else {
  console.log('✅ Security scan completed successfully');
  console.log('All security checks passed!\n');
  process.exit(0);
}
