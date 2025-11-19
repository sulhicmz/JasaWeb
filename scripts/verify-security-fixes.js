#!/usr/bin/env node

/**
 * Security Vulnerability Verification Script
 *
 * This script verifies that the security vulnerabilities mentioned in issue #303
 * have been properly addressed through dependency overrides.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

process.stderr.write('🔒 Security Vulnerability Verification\n');
process.stderr.write('=====================================\n');

// 1. Check pnpm audit results
process.stderr.write('1. Running pnpm audit...\n');
try {
  const auditResult = execSync('pnpm audit --json', { encoding: 'utf8' });
  const auditData = JSON.parse(auditResult);

  const vulnerabilities = auditData.metadata.vulnerabilities;
  process.stderr.write(`   Critical: ${vulnerabilities.critical}\n`);
  process.stderr.write(`   High: ${vulnerabilities.high}\n`);
  process.stderr.write(`   Moderate: ${vulnerabilities.moderate}\n`);
  process.stderr.write(`   Low: ${vulnerabilities.low}\n`);

  if (vulnerabilities.critical === 0 && vulnerabilities.high === 0) {
    process.stderr.write('   ✅ No critical or high vulnerabilities found\n');
  } else {
    process.stderr.write(
      '   ❌ Critical or high vulnerabilities still present\n'
    );
    process.exit(1);
  }
} catch (error) {
  process.stderr.write(`   ❌ Audit failed: ${error.message}\n`);
  process.exit(1);
}

// 2. Verify security overrides in package.json
process.stderr.write('\n2. Verifying security overrides...\n');
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const expectedOverrides = {
  'js-yaml': '4.1.1',
  nodemailer: '7.0.7',
  validator: '13.15.20',
  'html-minifier': 'npm:html-minifier-terser@7.2.0',
  'form-data': '2.5.5',
  'tough-cookie': '4.1.3',
  'node-notifier': '8.0.1',
  braces: '3.0.3',
  micromatch: '4.0.8',
  glob: '11.1.0',
};

const overrides = packageJson.pnpm?.overrides || {};
let allOverridesPresent = true;

for (const [pkg, version] of Object.entries(expectedOverrides)) {
  if (overrides[pkg] === version) {
    process.stderr.write(`   ✅ ${pkg}@${version}\n`);
  } else {
    process.stderr.write(
      `   ❌ ${pkg}: expected ${version}, found ${overrides[pkg] || 'missing'}\n`
    );
    allOverridesPresent = false;
  }
}

if (!allOverridesPresent) {
  process.stderr.write(
    '   ❌ Some security overrides are missing or incorrect\n'
  );
  process.exit(1);
}

// 3. Test build processes
process.stderr.write('\n3. Testing build processes...\n');
try {
  process.stderr.write('   Building API...\n');
  execSync('cd apps/api && pnpm build', { stdio: 'pipe' });
  process.stderr.write('   ✅ API build successful\n');

  process.stderr.write('   Building Web...\n');
  execSync('cd apps/web && pnpm build', { stdio: 'pipe' });
  process.stderr.write('   ✅ Web build successful\n');
} catch (error) {
  process.stderr.write(`   ❌ Build failed: ${error.message}\n`);
  process.exit(1);
}

// 4. Verify email templates are accessible
process.stderr.write('\n4. Verifying email templates...\n');
const templatesDir = path.join(__dirname, '../apps/api/templates');
const expectedTemplates = [
  'welcome.hbs',
  'approval-request.hbs',
  'approval-completed.hbs',
  'ticket-created.hbs',
  'ticket-status-changed.hbs',
  'invoice.hbs',
];

let allTemplatesPresent = true;
for (const template of expectedTemplates) {
  const templatePath = path.join(templatesDir, template);
  if (fs.existsSync(templatePath)) {
    process.stderr.write(`   ✅ ${template}\n`);
  } else {
    process.stderr.write(`   ❌ ${template} missing\n`);
    allTemplatesPresent = false;
  }
}

if (!allTemplatesPresent) {
  process.stderr.write('   ❌ Some email templates are missing\n');
  process.exit(1);
}

process.stderr.write('\n✅ All security vulnerability verifications passed!\n');
process.stderr.write('\nSummary:\n');
process.stderr.write('- No critical or high security vulnerabilities found\n');
process.stderr.write('- All security overrides are properly configured\n');
process.stderr.write('- Build processes work correctly\n');
process.stderr.write('- Email templates are accessible\n');
process.stderr.write(
  '\nThe security vulnerabilities mentioned in issue #303 have been successfully addressed.\n'
);
