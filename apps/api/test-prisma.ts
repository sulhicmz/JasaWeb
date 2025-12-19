// Test file to check what's available from @prisma/client
import * as Prisma from '@prisma/client';

console.log('Available exports:', Object.keys(Prisma));

// Check if models are available
try {
  const prisma = new Prisma.PrismaClient();
  console.log('PrismaClient methods:', Object.getOwnPropertyNames(prisma));
  console.log('Has project method:', 'project' in prisma);
  console.log('Has user method:', 'user' in prisma);
} catch (error) {
  console.error('Error creating PrismaClient:', error);
}

// Check specific exports
console.log('Has Prisma type:', 'Prisma' in Prisma);
console.log('Has User type:', 'User' in Prisma);
console.log('Has Project type:', 'Project' in Prisma);
