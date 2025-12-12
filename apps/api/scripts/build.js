#!/usr/bin/env node

/**
 * Secure build script for JasaWeb API
 *
 * This script ensures that:
 * 1. Environment variables are properly loaded and validated
 * 2. Database URL is available for Prisma generation
 * 3. Sensitive credentials are never hardcoded
 * 4. Build fails fast if required environment is missing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironment() {
  log('🔍 Validating environment configuration...', 'blue');

  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

  const missingVars = [];
  const warnings = [];

  // Check for .env file
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log(
      '⚠️  .env file not found. Using environment variables from system.',
      'yellow'
    );

    // Create .env from example if it doesn't exist
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      log(
        '💡 Tip: Copy .env.example to .env and configure your values',
        'yellow'
      );
    }
  }

  // Validate required environment variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      missingVars.push(envVar);
    } else {
      // Specific validations
      switch (envVar) {
        case 'DATABASE_URL':
          if (!value.startsWith('postgresql://')) {
            warnings.push(`${envVar} should start with 'postgresql://'`);
          }
          if (
            value.includes('localhost') &&
            process.env.NODE_ENV === 'production'
          ) {
            warnings.push(
              `${envVar} contains localhost in production environment`
            );
          }
          break;

        case 'JWT_SECRET':
        case 'JWT_REFRESH_SECRET':
          if (value.length < 32) {
            warnings.push(
              `${envVar} should be at least 32 characters long for security`
            );
          }
          if (value.includes('CHANGE_THIS')) {
            warnings.push(
              `${envVar} appears to be using the default/example value`
            );
          }
          break;
      }
    }
  }

  // Report missing variables
  if (missingVars.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missingVars.forEach((varName) => {
      log(`   - ${varName}`, 'red');
    });
    log(
      '\n💡 Please set these environment variables or create a .env file.',
      'yellow'
    );
    log('📄 Reference .env.example for required variables.', 'yellow');
    process.exit(1);
  }

  // Report warnings
  if (warnings.length > 0) {
    log('⚠️  Security warnings:', 'yellow');
    warnings.forEach((warning) => {
      log(`   - ${warning}`, 'yellow');
    });
    log('', 'reset');
  }

  log('✅ Environment validation passed!', 'green');
}

function runPrismaGenerate() {
  log('🔧 Generating Prisma client...', 'blue');

  try {
    execSync('./node_modules/.bin/prisma generate', { stdio: 'inherit' });
    log('✅ Prisma client generated successfully!', 'green');
  } catch (error) {
    log('❌ Failed to generate Prisma client:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function runNestBuild() {
  log('🏗️  Building NestJS application...', 'blue');

  try {
    execSync('nest build', { stdio: 'inherit' });
    log('✅ NestJS application built successfully!', 'green');
  } catch (error) {
    log('❌ Failed to build NestJS application:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function validateBuildOutput() {
  log('🔍 Validating build output...', 'blue');

  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ Build output directory (dist) not found!', 'red');
    process.exit(1);
  }

  const mainJsPath = path.join(distPath, 'main.js');
  if (!fs.existsSync(mainJsPath)) {
    log('❌ Main application file (dist/main.js) not found!', 'red');
    process.exit(1);
  }

  log('✅ Build output validation passed!', 'green');
}

function main() {
  log('🚀 Starting secure build process for JasaWeb API...', 'cyan');
  log('==================================================', 'cyan');

  try {
    validateEnvironment();
    runPrismaGenerate();
    runNestBuild();
    validateBuildOutput();

    log('==================================================', 'cyan');
    log('🎉 Build completed successfully!', 'green');
    log('📦 Your application is ready for deployment!', 'green');
  } catch (error) {
    log('==================================================', 'cyan');
    log('💥 Build process failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the build process
main();
