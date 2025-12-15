import { PrismaService } from './src/common/database/prisma.service';

async function testPrismaService() {
  const prisma = new PrismaService();

  try {
    // Test access to models
    console.log('Testing Prisma model access...');

    // Try accessing models that were mentioned in the error
    console.log('prisma.project exists:', 'project' in prisma);
    console.log('prisma.user exists:', 'user' in prisma);
    console.log('prisma.invoice exists:', 'invoice' in prisma);
    console.log('prisma.ticket exists:', 'ticket' in prisma);
    console.log('prisma.auditLog exists:', 'auditLog' in prisma);

    await prisma.$disconnect();
    console.log('PrismaService test completed successfully');
  } catch (error) {
    console.error('Error testing PrismaService:', error);
    await prisma.$disconnect();
  }
}

testPrismaService();
