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

console.log('🔒 Security Vulnerability Verification');
console.log('=====================================\n');

// 1. Check pnpm audit results
console.log('1. Running pnpm audit...');
try {
  const auditResult = execSync('pnpm audit --json', { encoding: 'utf8' });
  const auditData = JSON.parse(auditResult);

  const vulnerabilities = auditData.metadata.vulnerabilities;
  console.log(`   Critical: ${vulnerabilities.critical}`);
  console.log(`   High: ${vulnerabilities.high}`);
  console.log(`   Moderate: ${vulnerabilities.moderate}`);
  console.log(`   Low: ${vulnerabilities.low}`);

  if (vulnerabilities.critical === 0 && vulnerabilities.high === 0) {
    console.log('   ✅ No critical or high vulnerabilities found');
  } else {
    console.log('   ❌ Critical or high vulnerabilities still present');
    process.exit(1);
  }
} catch (error) {
  console.log('   ❌ Audit failed:', error.message);
  process.exit(1);
}

// 2. Verify security overrides in package.json
console.log('\n2. Verifying security overrides...');
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
    console.log(`   ✅ ${pkg}@${version}`);
  } else {
    console.log(
      `   ❌ ${pkg}: expected ${version}, found ${overrides[pkg] || 'missing'}`
    );
    allOverridesPresent = false;
  }
}

if (!allOverridesPresent) {
  console.log('   ❌ Some security overrides are missing or incorrect');
  process.exit(1);
}

// 3. Test build processes
console.log('\n3. Testing build processes...');
try {
  console.log('   Building API...');
  execSync('cd apps/api && pnpm build', { stdio: 'pipe' });
  console.log('   ✅ API build successful');

  console.log('   Building Web...');
  execSync('cd apps/web && pnpm build', { stdio: 'pipe' });
  console.log('   ✅ Web build successful');
} catch (error) {
  console.log('   ❌ Build failed:', error.message);
  process.exit(1);
}

// 4. Verify email templates are accessible
console.log('\n4. Verifying email templates...');
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
    console.log(`   ✅ ${template}`);
  } else {
    console.log(`   ❌ ${template} missing`);
    allTemplatesPresent = false;
  }
}

if (!allTemplatesPresent) {
  console.log('   ❌ Some email templates are missing');
  process.exit(1);
}

console.log('\n✅ All security vulnerability verifications passed!');
console.log('\nSummary:');
console.log('- No critical or high security vulnerabilities found');
console.log('- All security overrides are properly configured');
console.log('- Build processes work correctly');
console.log('- Email templates are accessible');
console.log(
  '\nThe security vulnerabilities mentioned in issue #303 have been successfully addressed.'
);
