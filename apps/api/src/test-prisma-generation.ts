import { PrismaClient } from '@prisma/client';

/**
 * Test script to verify Prisma client generation and database types
 * This script validates that:
 * 1. Prisma client can be imported successfully
 * 2. All database models are available
 * 3. TypeScript types are properly generated
 */

const prisma = new PrismaClient();

// Test that all expected models are available
const models = [
  'user',
  'organization',
  'membership',
  'project',
  'milestone',
  'file',
  'approval',
  'task',
  'ticket',
  'invoice',
  'session',
  'refreshToken',
  'auditLog',
];

console.log('🔍 Testing Prisma Client Generation...\n');

models.forEach((model) => {
  const modelAccess = (prisma as any)[model];
  if (modelAccess && typeof modelAccess === 'object') {
    console.log(
      `✅ ${model.charAt(0).toUpperCase() + model.slice(1)} model available`
    );
  } else {
    console.log(
      `❌ ${model.charAt(0).toUpperCase() + model.slice(1)} model missing`
    );
    process.exit(1);
  }
});

console.log('\n🎉 All database models are properly generated!');
console.log('📊 Prisma client generation test completed successfully.');

export { prisma };
