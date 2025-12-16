import { PrismaService } from './src/common/database/prisma.service';
import { logger } from '../../../packages/config/logger';

async function testPrismaService() {
  const prisma = new PrismaService();

  try {
    // Test access to models
    logger.info('Testing Prisma model access');

    // Try accessing models that were mentioned in the error
    const modelAccess = {
      project: 'project' in prisma,
      user: 'user' in prisma,
      invoice: 'invoice' in prisma,
      ticket: 'ticket' in prisma,
      auditLog: 'auditLog' in prisma,
    };

    logger.debug('Prisma model access check', modelAccess);

    await prisma.$disconnect();
    logger.info('PrismaService test completed successfully');
  } catch (error) {
    logger.error('Error testing PrismaService', error);
    await prisma.$disconnect();
  }
}

testPrismaService();
