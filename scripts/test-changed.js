#!/usr/bin/env node
/**
 * Script to test only changed packages/apps
 * Uses git to detect changes and run only affected tests
 */

const { execSync } = require('child_process');

// Get the list of changed files since the last commit
function getChangedFiles() {
  try {
    const result = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    return result.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.log('Could not get changed files from git, running all tests...');
    return [];
  }
}

// Determine which apps/packages were affected
function getAffectedApps(changedFiles) {
  const affected = new Set();

  for (const file of changedFiles) {
    if (file.startsWith('apps/web/')) {
      affected.add('web');
    } else if (file.startsWith('apps/api/')) {
      affected.add('api');
    } else if (file.startsWith('packages/ui/')) {
      affected.add('ui');
      // UI changes might affect both web and api
      affected.add('web');
      affected.add('api');
    } else if (file.startsWith('packages/')) {
      // Other shared packages might affect both
      affected.add('web');
      affected.add('api');
    }
  }

  return Array.from(affected);
}

// Run tests for the affected apps
function runTests(apps) {
  if (apps.length === 0) {
    console.log('No specific apps detected, running quick tests...');
    try {
      execSync('pnpm test:quick', { stdio: 'inherit' });
    } catch (error) {
      console.error('Quick tests failed:', error.message);
      process.exit(1);
    }
    return;
  }

  console.log(`🧪 Running tests for affected apps: ${apps.join(', ')}`);

  for (const app of apps) {
    console.log(`Testing ${app}...`);
    try {
      if (app === 'api') {
        execSync('cd apps/api && pnpm test -- --run --maxWorkers=2', { stdio: 'inherit' });
      } else if (app === 'web') {
        execSync('cd apps/web && pnpm test', { stdio: 'inherit' });
      }
      console.log(`✅ ${app} tests passed`);
    } catch (error) {
      console.error(`❌ ${app} tests failed:`, error.message);
      process.exit(1);
    }
  }
}

// Main function
function main() {
  console.log('🔍 Detecting changed files...');
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('No changed files detected, running quick tests...');
    execSync('pnpm test:quick', { stdio: 'inherit' });
    return;
  }

  console.log(`📝 Changed files: ${changedFiles.length} files`);
  const affectedApps = getAffectedApps(changedFiles);

  if (affectedApps.length > 0) {
    runTests(affectedApps);
  } else {
    console.log('No apps affected by changes, running quick tests');
    execSync('pnpm test:quick', { stdio: 'inherit' });
  }
}

// Run main function
main();
