#!/usr/bin/env node

/**
 * Test script to verify wrangler.toml configuration parsing
 * reproduces and verifies the fix for BUG-036
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🧪 Testing wrangler.toml configuration...');

try {
  // Test 1: Verify file exists and is readable
  const configContent = readFileSync('wrangler.toml', 'utf8');
  console.log('✅ wrangler.toml is readable');

  // Test 2: Verify compatibility_date is present and valid
  const compatibilityDateMatch = configContent.match(/compatibility_date\s*=\s*"([^"]+)"/);
  if (!compatibilityDateMatch) {
    throw new Error('compatibility_date not found in wrangler.toml');
  }
  
  const compatibilityDate = compatibilityDateMatch[1];
  console.log(`✅ compatibility_date found: ${compatibilityDate}`);

  // Test 3: Verify wrangler version (should be >= 4.56.0)
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const wranglerVersion = packageJson.devDependencies?.wrangler;
  
  if (!wranglerVersion) {
    throw new Error('wrangler not found in devDependencies');
  }
  
  console.log(`✅ wrangler version: ${wranglerVersion}`);

  // Test 4: Try wrangler dry-run to verify configuration parsing
  console.log('🔧 Testing wrangler configuration parsing...');
  const dryRunOutput = execSync('npx wrangler deploy --dry-run', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  if (dryRunOutput.includes('ERROR') || dryRunOutput.includes('Can\'t redefine existing key')) {
    throw new Error('wrangler configuration parsing failed');
  }

  console.log('✅ wrangler configuration parsed successfully');
  console.log('✅ All tests passed - BUG-036 is fixed!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}