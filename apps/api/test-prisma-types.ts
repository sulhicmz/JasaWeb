// Test file to check proper Prisma type imports
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:test',
    },
  },
});

// Check if model methods exist
console.log('Has project method:', typeof prisma.project === 'function');
console.log('Has user method:', typeof prisma.user === 'function');

// Check types via typeof
type User = typeof prisma.user;
type Project = typeof prisma.project;

// Check what's available in Prisma namespace
import { Prisma } from '@prisma/client';

// These should be the model types
type UserType = Prisma.User;
type ProjectType = Prisma.Project;

console.log('Successfully created PrismaClient');
