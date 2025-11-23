import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const onboardingSteps = [
  {
    stepKey: 'welcome',
    title: 'Welcome to JasaWeb',
    description:
      'Get started with a quick overview of the platform and what you can accomplish.',
    order: 1,
    isRequired: true,
    dependsOn: [],
    config: {
      showVideo: true,
      estimatedTime: '2 minutes',
    },
  },
  {
    stepKey: 'org-setup',
    title: 'Set Up Your Organization',
    description:
      'Configure your organization profile, billing information, and basic settings.',
    order: 2,
    isRequired: true,
    dependsOn: ['welcome'],
    config: {
      fields: ['companyName', 'billingEmail', 'timezone', 'industry'],
      estimatedTime: '5 minutes',
    },
  },
  {
    stepKey: 'team-invite',
    title: 'Invite Your Team',
    description:
      'Add team members and assign roles to collaborate effectively.',
    order: 3,
    isRequired: false,
    dependsOn: ['org-setup'],
    config: {
      maxInvites: 10,
      roles: ['admin', 'member', 'reviewer'],
      estimatedTime: '3 minutes',
    },
  },
  {
    stepKey: 'project-create',
    title: 'Create Your First Project',
    description: 'Set up your first project with milestones and deliverables.',
    order: 4,
    isRequired: true,
    dependsOn: ['org-setup'],
    config: {
      templates: ['website', 'portal', 'custom'],
      estimatedTime: '10 minutes',
    },
  },
  {
    stepKey: 'tour',
    title: 'Interactive Platform Tour',
    description:
      'Take a guided tour of the main features and learn how to navigate the platform.',
    order: 5,
    isRequired: false,
    dependsOn: ['project-create'],
    config: {
      highlights: ['dashboard', 'projects', 'files', 'approvals'],
      estimatedTime: '5 minutes',
    },
  },
];

async function seedOnboardingSteps() {
  console.log('🌱 Seeding onboarding steps...');

  for (const step of onboardingSteps) {
    await prisma.onboardingStep.upsert({
      where: { stepKey: step.stepKey },
      update: step,
      create: step,
    });
  }

  console.log('✅ Onboarding steps seeded successfully');
}

async function main() {
  try {
    await seedOnboardingSteps();
  } catch (error) {
    console.error('❌ Error seeding onboarding steps:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedOnboardingSteps };
