#!/usr/bin/env node

// Compatibility patch for gray-matter to work with js-yaml 4.x
// This script patches the gray-matter module to replace safeLoad with load
// since safeLoad was removed in js-yaml 4.x

const fs = require('fs');
const path = require('path');

// Path to gray-matter engines.js
const grayMatterEnginesPath = path.join(
  __dirname,
  '../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/engines.js'
);

if (fs.existsSync(grayMatterEnginesPath)) {
  let content = fs.readFileSync(grayMatterEnginesPath, 'utf8');

  // Replace safeLoad with load since safeLoad was removed in js-yaml 4.x
  // load is now safe by default in js-yaml 4.x
  content = content.replace(
    /yaml\.safeLoad\.bind\(yaml\)/g,
    'yaml.load.bind(yaml)'
  );

  // Also replace safeDump with dump if present
  content = content.replace(
    /yaml\.safeDump\.bind\(yaml\)/g,
    'yaml.dump.bind(yaml)'
  );

  fs.writeFileSync(grayMatterEnginesPath, content, 'utf8');
  // Successfully patched gray-matter engines for js-yaml 4.x compatibility
} else {
  // gray-matter engines not found, skipping patch
}
