#!/usr/bin/env node
// This script checks if we're in a CI environment and skips Husky installation if so
const isCI =
  process.env.CI || process.env.SKIP_HUSKY || process.env.CLOUDFLARE_PAGES;

if (!isCI) {
  try {
    // Check if husky is available
    const huskyPath = require.resolve('husky', { paths: [process.cwd()] });
    if (huskyPath) {
      const husky = require('husky');
      husky.install();
      console.log('Husky installed successfully');
    }
  } catch (error) {
    console.log('Husky not installed (this is expected in CI environments)');
  }
} else {
  console.log('Skipping Husky installation in CI environment');
}
