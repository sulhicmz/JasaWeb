import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export const getTestDatabase = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/jasaweb_test',
        },
      },
    });
  }
  return prisma;
};

export const cleanDatabase = async () => {
  const db = getTestDatabase();

  // Delete in order to respect foreign key constraints
  await db.approval.deleteMany();
  await db.invoice.deleteMany();
  await db.ticket.deleteMany();
  await db.task.deleteMany();
  await db.file.deleteMany();
  await db.milestone.deleteMany();
  await db.project.deleteMany();
  await db.refreshToken.deleteMany();
  await db.user.deleteMany();
  await db.organization.deleteMany();
};

export const seedTestData = async () => {
  const db = getTestDatabase();

  // Create test organization
  const org = await db.organization.create({
    data: {
      id: 'test-org-1',
      name: 'Test Organization',
      slug: 'test-org',
    },
  });

  // Create test user
  const user = await db.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      password: '$2b$10$hashedpassword',
      organizationId: org.id,
    },
  });

  // Create test project
  const project = await db.project.create({
    data: {
      id: 'test-project-1',
      name: 'Test Project',
      status: 'active',
      organizationId: org.id,
    },
  });

  return { org, user, project };
};

export const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};
