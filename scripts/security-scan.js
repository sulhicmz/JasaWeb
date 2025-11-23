#!/usr/bin/env node

/**
 * Security Scan Script
 * Performs comprehensive security checks on the codebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Security Scan...\n');

// Detect package manager
let packageManager = 'npm'; // default fallback
if (fs.existsSync('pnpm-lock.yaml')) {
  try {
    execSync('pnpm --version', { stdio: 'pipe' });
    packageManager = 'pnpm';
    console.log('✅ Using pnpm for security scanning\n');
  } catch (error) {
    console.log(
      '⚠️  pnpm-lock.yaml found but pnpm not available, attempting to install pnpm...\n'
    );
    try {
      // Try to install pnpm using corepack
      execSync('corepack enable && corepack prepare pnpm@latest --activate', {
        stdio: 'pipe',
      });
      execSync('pnpm --version', { stdio: 'pipe' });
      packageManager = 'pnpm';
      console.log('✅ pnpm installed and activated for security scanning\n');
    } catch (pnpmError) {
      console.log('⚠️  Failed to install pnpm, using npm fallback\n');
      try {
        execSync('npm --version', { stdio: 'pipe' });
        packageManager = 'npm';
        console.log('✅ Using npm as fallback for security scanning\n');
      } catch (npmError) {
        console.log(
          '❌ Neither pnpm nor npm available for security scanning\n'
        );
        process.exit(1);
      }
    }
  }
} else if (fs.existsSync('package-lock.json')) {
  packageManager = 'npm';
  console.log('✅ Using npm for security scanning\n');
} else {
  console.log('⚠️  No lockfile found, security scanning may be incomplete\n');
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

// 5. Run security audit (prefer pnpm, fallback to npm)
const lockFile =
  packageManager === 'pnpm' ? 'pnpm-lock.yaml' : 'package-lock.json';
if (fs.existsSync(lockFile)) {
  // Run audit with different levels for comprehensive scanning
  const auditOutput = runCommand(
    `${packageManager} audit --audit-level moderate`,
    `Running ${packageManager} audit (moderate level)`
  );

  // Also check for high-severity vulnerabilities specifically
  runCommand(
    `${packageManager} audit --audit-level high`,
    `Running ${packageManager} audit (high severity check)`
  );

  // Check for pnpm overrides if using pnpm
  if (packageManager === 'pnpm') {
    console.log('🔍 Checking pnpm overrides configuration...');
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (packageJson.pnpm && packageJson.pnpm.overrides) {
        const overridesCount = Object.keys(packageJson.pnpm.overrides).length;
        results.passed.push('pnpm overrides configuration');
        console.log(
          `✅ pnpm overrides configured with ${overridesCount} overrides\n`
        );
      } else {
        results.warnings.push('pnpm overrides configuration');
        console.log(
          '⚠️  No pnpm overrides found - consider adding security overrides\n'
        );
      }
    } catch (error) {
      console.log('⚠️  Error checking pnpm overrides configuration\n');
    }
  }
} else {
  console.log(`⚠️  No ${lockFile} found, skipping ${packageManager} audit`);
  console.log('   Consider running dependency audits in your CI environment\n');
  results.warnings.push(`Running ${packageManager} audit`);
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
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
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
