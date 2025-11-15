#!/usr/bin/env node

/**
 * Security Scan Script
 * Performs comprehensive security checks on the codebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Security Scan...\n');

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
  excludePattern = ''
) {
  try {
    console.log(`🔍 ${description}...`);
    let command = `grep -r -i -E '${pattern}' --include='*.ts' --include='*.js' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . || true`;
    if (excludePattern) {
      command = `grep -r -i -E '${pattern}' --include='*.ts' --include='*.js' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude=${excludePattern} . || true`;
    }
    const output = execSync(command, { encoding: 'utf-8' });

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

// 1. Check for hardcoded secrets
checkFilePatterns(
  'password.*=.*["\047][a-zA-Z0-9]{8,}["\047]',
  'Checking for hardcoded secrets',
  'error'
);

// 2. Check for eval() usage (excluding this script)
checkFilePatterns(
  'eval\\(',
  'Checking for eval() usage',
  'error',
  'security-scan.js'
);

// 3. Check for console.log in production code
checkFilePatterns(
  'console\\.(log|debug|info)',
  'Checking for console statements',
  'warning'
);

// 4. Check for TODO/FIXME comments
checkFilePatterns(
  '(TODO|FIXME|XXX|HACK)',
  'Checking for TODO/FIXME comments',
  'warning'
);

// 5. Run pnpm audit
runCommand('pnpm audit --audit-level moderate', 'Running pnpm audit');

// 6. Check for outdated dependencies
console.log('🔍 Checking for outdated dependencies...');
try {
  execSync('pnpm outdated', { encoding: 'utf-8', stdio: 'pipe' });
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
