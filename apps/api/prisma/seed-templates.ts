import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding project templates...');

  // Create School Website Template
  const schoolWebsiteTemplate = await prisma.projectTemplate.create({
    data: {
      name: 'School Website Template',
      description:
        'Complete website development package for educational institutions',
      serviceType: 'school-website',
      version: '1.0',
      settings: {
        estimatedDuration: 60, // days
        teamSize: 3,
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        features: [
          'Student Portal',
          'Teacher Dashboard',
          'Event Calendar',
          'News Section',
        ],
      },
    },
  });

  // Create milestones for School Website
  const schoolMilestones = [
    {
      title: 'Discovery & Planning',
      description:
        'Requirements gathering, stakeholder interviews, and project planning',
      order: 1,
      durationDays: 7,
      isRequired: true,
    },
    {
      title: 'Design & UX',
      description: 'Wireframing, mockups, and user experience design',
      order: 2,
      durationDays: 10,
      isRequired: true,
    },
    {
      title: 'Frontend Development',
      description: 'Implementing the user interface and interactions',
      order: 3,
      durationDays: 15,
      isRequired: true,
    },
    {
      title: 'Backend Development',
      description: 'API development, database setup, and business logic',
      order: 4,
      durationDays: 12,
      isRequired: true,
    },
    {
      title: 'Content Integration',
      description: 'Adding school content, images, and multimedia',
      order: 5,
      durationDays: 8,
      isRequired: true,
    },
    {
      title: 'Testing & QA',
      description:
        'Comprehensive testing, bug fixes, and performance optimization',
      order: 6,
      durationDays: 5,
      isRequired: true,
    },
    {
      title: 'Deployment & Training',
      description: 'Website deployment and staff training',
      order: 7,
      durationDays: 3,
      isRequired: true,
    },
  ];

  for (const milestoneData of schoolMilestones) {
    const milestone = await prisma.milestoneTemplate.create({
      data: {
        projectTemplateId: schoolWebsiteTemplate.id,
        ...milestoneData,
      },
    });

    // Add tasks for each milestone
    const tasks = getTasksForMilestone(milestone.title, 'school-website');
    for (const taskData of tasks) {
      await prisma.taskTemplate.create({
        data: {
          milestoneTemplateId: milestone.id,
          ...taskData,
        },
      });
    }
  }

  // Create News Portal Template
  const newsPortalTemplate = await prisma.projectTemplate.create({
    data: {
      name: 'News Portal Template',
      description:
        'Comprehensive news portal with content management and real-time updates',
      serviceType: 'news-portal',
      version: '1.0',
      settings: {
        estimatedDuration: 45, // days
        teamSize: 4,
        technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis'],
        features: [
          'Article Management',
          'Category System',
          'Search',
          'Comments',
          'Analytics',
        ],
      },
    },
  });

  // Create milestones for News Portal
  const newsMilestones = [
    {
      title: 'Content Strategy & Planning',
      description:
        'Editorial workflow, content categories, and user roles definition',
      order: 1,
      durationDays: 5,
      isRequired: true,
    },
    {
      title: 'Information Architecture',
      description: 'Site structure, navigation, and content organization',
      order: 2,
      durationDays: 7,
      isRequired: true,
    },
    {
      title: 'Design System',
      description: 'UI components, layouts, and responsive design',
      order: 3,
      durationDays: 10,
      isRequired: true,
    },
    {
      title: 'CMS Development',
      description: 'Content management system and editorial tools',
      order: 4,
      durationDays: 12,
      isRequired: true,
    },
    {
      title: 'Frontend Implementation',
      description: 'Public-facing website and reader experience',
      order: 5,
      durationDays: 8,
      isRequired: true,
    },
    {
      title: 'Integration & Testing',
      description:
        'Third-party integrations, performance testing, and optimization',
      order: 6,
      durationDays: 3,
      isRequired: true,
    },
  ];

  for (const milestoneData of newsMilestones) {
    const milestone = await prisma.milestoneTemplate.create({
      data: {
        projectTemplateId: newsPortalTemplate.id,
        ...milestoneData,
      },
    });

    // Add tasks for each milestone
    const tasks = getTasksForMilestone(milestone.title, 'news-portal');
    for (const taskData of tasks) {
      await prisma.taskTemplate.create({
        data: {
          milestoneTemplateId: milestone.id,
          ...taskData,
        },
      });
    }
  }

  // Create Company Profile Template
  const companyProfileTemplate = await prisma.projectTemplate.create({
    data: {
      name: 'Company Profile Template',
      description:
        'Professional company website with corporate branding and business features',
      serviceType: 'company-profile',
      version: '1.0',
      settings: {
        estimatedDuration: 30, // days
        teamSize: 2,
        technologies: ['Astro', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
        features: ['About Us', 'Services', 'Portfolio', 'Contact Form', 'Blog'],
      },
    },
  });

  // Create milestones for Company Profile
  const companyMilestones = [
    {
      title: 'Brand Analysis',
      description: 'Brand guidelines, competitor analysis, and positioning',
      order: 1,
      durationDays: 3,
      isRequired: true,
    },
    {
      title: 'Content Strategy',
      description: 'Copywriting, imagery, and content structure',
      order: 2,
      durationDays: 5,
      isRequired: true,
    },
    {
      title: 'Design & Layout',
      description:
        'Visual design, branding implementation, and responsive layouts',
      order: 3,
      durationDays: 8,
      isRequired: true,
    },
    {
      title: 'Development',
      description: 'Website implementation, animations, and interactions',
      order: 4,
      durationDays: 10,
      isRequired: true,
    },
    {
      title: 'Review & Launch',
      description: 'Client review, revisions, and website deployment',
      order: 5,
      durationDays: 4,
      isRequired: true,
    },
  ];

  for (const milestoneData of companyMilestones) {
    const milestone = await prisma.milestoneTemplate.create({
      data: {
        projectTemplateId: companyProfileTemplate.id,
        ...milestoneData,
      },
    });

    // Add tasks for each milestone
    const tasks = getTasksForMilestone(milestone.title, 'company-profile');
    for (const taskData of tasks) {
      await prisma.taskTemplate.create({
        data: {
          milestoneTemplateId: milestone.id,
          ...taskData,
        },
      });
    }
  }

  console.log('✅ Project templates seeded successfully!');
}

function getTasksForMilestone(milestoneTitle: string, serviceType: string) {
  const taskMap: Record<string, Record<string, any[]>> = {
    'school-website': {
      'Discovery & Planning': [
        {
          title: 'Stakeholder interviews',
          order: 1,
          assigneeRole: 'project-manager',
          durationDays: 2,
        },
        {
          title: 'Requirements documentation',
          order: 2,
          assigneeRole: 'business-analyst',
          durationDays: 3,
        },
        {
          title: 'Project timeline creation',
          order: 3,
          assigneeRole: 'project-manager',
          durationDays: 2,
        },
      ],
      'Design & UX': [
        {
          title: 'Wireframe creation',
          order: 1,
          assigneeRole: 'ux-designer',
          durationDays: 4,
        },
        {
          title: 'Visual design mockups',
          order: 2,
          assigneeRole: 'ui-designer',
          durationDays: 4,
        },
        {
          title: 'Design review and approval',
          order: 3,
          assigneeRole: 'project-manager',
          durationDays: 2,
        },
      ],
      'Frontend Development': [
        {
          title: 'Component library setup',
          order: 1,
          assigneeRole: 'frontend-developer',
          durationDays: 3,
        },
        {
          title: 'Page implementation',
          order: 2,
          assigneeRole: 'frontend-developer',
          durationDays: 8,
        },
        {
          title: 'Responsive design testing',
          order: 3,
          assigneeRole: 'qa-engineer',
          durationDays: 4,
        },
      ],
      'Backend Development': [
        {
          title: 'Database schema design',
          order: 1,
          assigneeRole: 'backend-developer',
          durationDays: 3,
        },
        {
          title: 'API development',
          order: 2,
          assigneeRole: 'backend-developer',
          durationDays: 7,
        },
        {
          title: 'Authentication system',
          order: 3,
          assigneeRole: 'backend-developer',
          durationDays: 2,
        },
      ],
      'Content Integration': [
        {
          title: 'Content migration',
          order: 1,
          assigneeRole: 'content-manager',
          durationDays: 4,
        },
        {
          title: 'Media optimization',
          order: 2,
          assigneeRole: 'frontend-developer',
          durationDays: 2,
        },
        {
          title: 'Content testing',
          order: 3,
          assigneeRole: 'qa-engineer',
          durationDays: 2,
        },
      ],
      'Testing & QA': [
        {
          title: 'Functional testing',
          order: 1,
          assigneeRole: 'qa-engineer',
          durationDays: 2,
        },
        {
          title: 'Performance testing',
          order: 2,
          assigneeRole: 'qa-engineer',
          durationDays: 2,
        },
        {
          title: 'Bug fixes and optimization',
          order: 3,
          assigneeRole: 'frontend-developer',
          durationDays: 1,
        },
      ],
      'Deployment & Training': [
        {
          title: 'Production deployment',
          order: 1,
          assigneeRole: 'devops-engineer',
          durationDays: 1,
        },
        {
          title: 'Staff training session',
          order: 2,
          assigneeRole: 'project-manager',
          durationDays: 1,
        },
        {
          title: 'Documentation handover',
          order: 3,
          assigneeRole: 'project-manager',
          durationDays: 1,
        },
      ],
    },
    'news-portal': {
      'Content Strategy & Planning': [
        {
          title: 'Editorial workflow design',
          order: 1,
          assigneeRole: 'content-strategist',
          durationDays: 2,
        },
        {
          title: 'User role definitions',
          order: 2,
          assigneeRole: 'business-analyst',
          durationDays: 2,
        },
        {
          title: 'Content category structure',
          order: 3,
          assigneeRole: 'content-manager',
          durationDays: 1,
        },
      ],
      'Information Architecture': [
        {
          title: 'Site map creation',
          order: 1,
          assigneeRole: 'information-architect',
          durationDays: 3,
        },
        {
          title: 'Navigation design',
          order: 2,
          assigneeRole: 'ux-designer',
          durationDays: 2,
        },
        {
          title: 'Content organization',
          order: 3,
          assigneeRole: 'content-manager',
          durationDays: 2,
        },
      ],
      'Design System': [
        {
          title: 'Component library',
          order: 1,
          assigneeRole: 'ui-designer',
          durationDays: 5,
        },
        {
          title: 'Layout templates',
          order: 2,
          assigneeRole: 'ui-designer',
          durationDays: 3,
        },
        {
          title: 'Responsive design',
          order: 3,
          assigneeRole: 'frontend-developer',
          durationDays: 2,
        },
      ],
      'CMS Development': [
        {
          title: 'Article management system',
          order: 1,
          assigneeRole: 'backend-developer',
          durationDays: 5,
        },
        {
          title: 'Editor interface',
          order: 2,
          assigneeRole: 'frontend-developer',
          durationDays: 4,
        },
        {
          title: 'Media management',
          order: 3,
          assigneeRole: 'backend-developer',
          durationDays: 3,
        },
      ],
      'Frontend Implementation': [
        {
          title: 'Homepage development',
          order: 1,
          assigneeRole: 'frontend-developer',
          durationDays: 3,
        },
        {
          title: 'Article pages',
          order: 2,
          assigneeRole: 'frontend-developer',
          durationDays: 3,
        },
        {
          title: 'Search functionality',
          order: 3,
          assigneeRole: 'frontend-developer',
          durationDays: 2,
        },
      ],
      'Integration & Testing': [
        {
          title: 'Analytics integration',
          order: 1,
          assigneeRole: 'backend-developer',
          durationDays: 1,
        },
        {
          title: 'Performance optimization',
          order: 2,
          assigneeRole: 'frontend-developer',
          durationDays: 1,
        },
        {
          title: 'Final testing',
          order: 3,
          assigneeRole: 'qa-engineer',
          durationDays: 1,
        },
      ],
    },
    'company-profile': {
      'Brand Analysis': [
        {
          title: 'Brand guidelines review',
          order: 1,
          assigneeRole: 'brand-strategist',
          durationDays: 1,
        },
        {
          title: 'Competitor analysis',
          order: 2,
          assigneeRole: 'market-researcher',
          durationDays: 1,
        },
        {
          title: 'Brand positioning document',
          order: 3,
          assigneeRole: 'brand-strategist',
          durationDays: 1,
        },
      ],
      'Content Strategy': [
        {
          title: 'Copywriting',
          order: 1,
          assigneeRole: 'copywriter',
          durationDays: 3,
        },
        {
          title: 'Image selection',
          order: 2,
          assigneeRole: 'content-manager',
          durationDays: 1,
        },
        {
          title: 'Content structure',
          order: 3,
          assigneeRole: 'content-strategist',
          durationDays: 1,
        },
      ],
      'Design & Layout': [
        {
          title: 'Visual design concept',
          order: 1,
          assigneeRole: 'ui-designer',
          durationDays: 4,
        },
        {
          title: 'Page layouts',
          order: 2,
          assigneeRole: 'ui-designer',
          durationDays: 3,
        },
        {
          title: 'Mobile responsiveness',
          order: 3,
          assigneeRole: 'frontend-developer',
          durationDays: 1,
        },
      ],
      Development: [
        {
          title: 'HTML/CSS implementation',
          order: 1,
          assigneeRole: 'frontend-developer',
          durationDays: 6,
        },
        {
          title: 'JavaScript interactions',
          order: 2,
          assigneeRole: 'frontend-developer',
          durationDays: 3,
        },
        {
          title: 'Contact form integration',
          order: 3,
          assigneeRole: 'frontend-developer',
          durationDays: 1,
        },
      ],
      'Review & Launch': [
        {
          title: 'Client review session',
          order: 1,
          assigneeRole: 'project-manager',
          durationDays: 1,
        },
        {
          title: 'Revisions implementation',
          order: 2,
          assigneeRole: 'frontend-developer',
          durationDays: 2,
        },
        {
          title: 'Website deployment',
          order: 3,
          assigneeRole: 'devops-engineer',
          durationDays: 1,
        },
      ],
    },
  };

  return taskMap[serviceType]?.[milestoneTitle] || [];
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
