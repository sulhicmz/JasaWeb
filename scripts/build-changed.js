#!/usr/bin/env node
/**
 * Script to build only changed packages/apps
 * Uses git to detect changes and build only affected components
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the list of changed files since the last commit
function getChangedFiles() {
  try {
    const result = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    return result.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.log('Could not get changed files from git, building all...');
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

// Build the affected apps
function buildApps(apps) {
  if (apps.length === 0) {
    console.log('No specific apps detected, building all...');
    execSync('pnpm build', { stdio: 'inherit' });
    return;
  }

  console.log(`Building affected apps: ${apps.join(', ')}`);

  for (const app of apps) {
    console.log(`Building ${app}...`);
    try {
      execSync(`pnpm build:${app}`, { stdio: 'inherit' });
      console.log(`✅ ${app} built successfully`);
    } catch (error) {
      console.error(`❌ Failed to build ${app}:`, error.message);
      process.exit(1);
    }
  }
}

// Main function
function main() {
  console.log('🔍 Detecting changed files...');
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('No changed files detected, building all apps...');
    execSync('pnpm build', { stdio: 'inherit' });
    return;
  }

  console.log(`📝 Changed files: ${changedFiles.length} files`);
  const affectedApps = getAffectedApps(changedFiles);

  if (affectedApps.length > 0) {
    buildApps(affectedApps);
  } else {
    console.log('No apps affected by changes, skipping build');
  }
}

// Run main function
main();
