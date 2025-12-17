#!/usr/bin/env node

/**
 * Secure Environment Configuration Generator
 *
 * This script generates cryptographically secure secrets and validates
 * environment configurations to prevent hardcoded credentials.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SECURITY_REQUIREMENTS = {
  POSTGRES_PASSWORD: {
    minLength: 32,
    excludePatterns: [/password/i, /admin/i, /123456/],
    description: 'PostgreSQL database password',
  },
  REDIS_PASSWORD: {
    minLength: 32,
    excludePatterns: [/redis/i, /password/i, /123456/],
    description: 'Redis cache password',
  },
  JWT_SECRET: {
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description: 'JWT signing secret',
  },
  JWT_REFRESH_SECRET: {
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description: 'JWT refresh token secret',
  },
  SESSION_SECRET: {
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description: 'Session management secret',
  },
  ENCRYPTION_KEY: {
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description: 'Data encryption key',
  },
  MINIO_ROOT_PASSWORD: {
    minLength: 32,
    excludePatterns: [/minio/i, /admin/i, /password/i],
    description: 'MinIO storage root password',
  },
  MINIO_ACCESS_KEY: {
    minLength: 16,
    excludePatterns: [/minio/i, /admin/i],
    description: 'MinIO access key',
  },
  MINIO_ROOT_USER: {
    minLength: 8,
    excludePatterns: [/minio/i, /admin/i],
    description: 'MinIO root username',
  },
};

function generateSecureSecret(length, pattern, excludePatterns) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=_-';
  let secret;

  do {
    const bytes = crypto.randomBytes(length);
    secret = Array.from(bytes)
      .map((byte) => chars[byte % chars.length])
      .join('');
  } while (
    excludePatterns?.some((exclude) => exclude.test(secret)) ||
    (pattern && !pattern.test(secret))
  );

  return secret;
}

function validateExistingSecret(secret, config) {
  if (secret.length < config.minLength) {
    return false;
  }

  if (config.pattern && !config.pattern.test(secret)) {
    return false;
  }

  if (config.excludePatterns?.some((exclude) => exclude.test(secret))) {
    return false;
  }

  return true;
}

function checkForWeakCredentials() {
  const weakPatterns = [
    /minioadmin/i,
    /admin123/i,
    /CHANGE_THIS/i,
    /password/i,
    /123456/,
    /qwerty/i,
    /secret/i,
  ];

  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    const lines = content.split('\\n');

    const issues = [];

    lines.forEach((line, index) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');

        if (value) {
          for (const pattern of weakPatterns) {
            if (pattern.test(value)) {
              issues.push({
                line: index + 1,
                issue: `Weak pattern detected in ${key}: ${pattern.source}`,
              });
              break;
            }
          }
        }
      }
    });

    if (issues.length > 0) {
      console.error('❌ Security Issues Found:');
      issues.forEach(({ line, issue }) => {
        console.error(`   Line ${line}: ${issue}`);
      });
      return false;
    }
  }

  return true;
}

function generateSecureEnvFile() {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example file not found');
    return false;
  }

  let content = fs.readFileSync(envExamplePath, 'utf8');
  const generatedSecrets = {};

  // Replace placeholder values with secure secrets
  Object.entries(SECURITY_REQUIREMENTS).forEach(([key, config]) => {
    const placeholderRegex = new RegExp(`^${key}=.*$`, 'gm');

    // Check if we need to replace or keep existing secure value
    const existingMatch = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    let shouldGenerate = true;

    if (existingMatch) {
      const existingValue = existingMatch[1];
      if (validateExistingSecret(existingValue, config)) {
        shouldGenerate = false;
        console.log(`✅ Keeping existing secure ${config.description}`);
      }
    }

    if (shouldGenerate) {
      const secureValue = generateSecureSecret(
        config.minLength,
        config.pattern,
        config.excludePatterns
      );
      generatedSecrets[key] = secureValue;
      content = content.replace(placeholderRegex, `${key}=${secureValue}`);
      console.log(`🔑 Generated secure ${config.description}`);
    }
  });

  // Add security headers and warnings
  const securityHeader = `# =============================================================================
# SECURITY CONFIGURATION - AUTO-GENERATED
# Generated on: ${new Date().toISOString()}
# This file contains generated secrets. DO NOT commit to version control.
# =============================================================================
`;

  content = securityHeader + content;

  fs.writeFileSync(envPath, content);
  console.log('✅ Secure .env file generated successfully');

  // Display generated secrets for immediate use
  if (Object.keys(generatedSecrets).length > 0) {
    console.log('\\n🔐 Generated Secrets (copy these to your secure storage):');
    console.log('='.repeat(60));
    Object.entries(generatedSecrets).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    console.log('='.repeat(60));
    console.log(
      '⚠️  Store these secrets safely. They will not be shown again.'
    );
  }

  return true;
}

function updateEnvExample() {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  let content = fs.readFileSync(envExamplePath, 'utf8');

  // Replace hardcoded default credentials with placeholders in .env.example
  const replacements = [
    {
      pattern: /^MINIO_ACCESS_KEY=minioadmin$/m,
      replacement: 'MINIO_ACCESS_KEY=GENERATE_ACCESS_KEY_HERE',
    },
    {
      pattern: /^MINIO_ROOT_USER=minioadmin$/m,
      replacement: 'MINIO_ROOT_USER=GENERATE_ROOT_USER_HERE',
    },
  ];

  let modified = false;
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      console.log(`🔄 Updated placeholder in .env.example`);
    }
  });

  if (modified) {
    fs.writeFileSync(envExamplePath, content);
    console.log('✅ .env.example sanitized successfully');
  }
}

function main() {
  console.log('🔒 JasaWeb Security Configuration Generator');
  console.log('='.repeat(50));

  // Check for existing weak credentials
  if (!checkForWeakCredentials()) {
    console.log('\\n💡 Run script with --force to overwrite weak credentials');
    process.exit(1);
  }

  // Generate secure .env file
  if (!generateSecureEnvFile()) {
    console.error('❌ Failed to generate secure environment file');
    process.exit(1);
  }

  // Update .env.example to remove hardcoded defaults
  updateEnvExample();

  console.log('\\n🎉 Security configuration completed successfully!');
  console.log('📋 Next steps:');
  console.log('   1. Store the generated secrets in a secure location');
  console.log('   2. Update your deployment environment variables');
  console.log('   3. Add .env to .gitignore if not already present');
  console.log('   4. Test the application with new credentials');
}

if (process.argv.includes('--force')) {
  console.log('⚡ Force mode enabled - will overwrite existing credentials');
}

main();
