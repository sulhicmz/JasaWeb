#!/usr/bin/env node

/**
 * js-yaml compatibility fix for Astro
 * This script patches gray-matter to be compatible with js-yaml 4.x
 * by replacing deprecated safeLoad/safeDump methods with load/dump
 */

const fs = require('fs');
const path = require('path');

// Function to patch gray-matter engines.js file
function patchGrayMatter() {
  try {
    // Look for gray-matter in node_modules
    const grayMatterPath = path.join(
      __dirname,
      '..',
      'node_modules',
      'gray-matter',
      'lib',
      'engines.js'
    );
    const grayMatterPnpmPath = path.join(
      __dirname,
      '..',
      'node_modules',
      '.pnpm',
      'gray-matter@4.0.3',
      'node_modules',
      'gray-matter',
      'lib',
      'engines.js'
    );

    let enginesPath = null;

    if (fs.existsSync(grayMatterPath)) {
      enginesPath = grayMatterPath;
    } else if (fs.existsSync(grayMatterPnpmPath)) {
      enginesPath = grayMatterPnpmPath;
    }

    if (!enginesPath) {
      console.log('gray-matter not found, skipping patch');
      return;
    }

    // Read the engines.js file
    let content = fs.readFileSync(enginesPath, 'utf8');

    // Check if already patched
    if (content.includes('yamlCompat')) {
      console.log('gray-matter already patched');
      return;
    }

    // Replace the deprecated methods with compatible ones
    content = content.replace(
      "const yaml = require('js-yaml');",
      "const yaml = require('js-yaml');\n\n// Compatibility for js-yaml 4.x\nconst yamlCompat = {\n  parse: yaml.load || yaml.safeLoad,\n  stringify: yaml.dump || yaml.safeDump\n};"
    );

    content = content.replace(
      '  parse: yaml.safeLoad.bind(yaml),\n  stringify: yaml.safeDump.bind(yaml)',
      '  parse: yamlCompat.parse.bind(yaml),\n  stringify: yamlCompat.stringify.bind(yaml)'
    );

    // Write the patched content back
    fs.writeFileSync(enginesPath, content, 'utf8');
    console.log(
      'Successfully patched gray-matter for js-yaml 4.x compatibility'
    );
  } catch (error) {
    console.warn('Failed to patch gray-matter:', error.message);
  }
}

// Run the patch
patchGrayMatter();
