import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { logger } from '../../../packages/config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Seeding knowledge base data');

  // Create categories
  const gettingStartedCategory = await prisma.knowledgeBaseCategory.create({
    data: {
      name: 'Getting Started',
      description: 'Learn the basics of using JasaWeb platform',
      icon: '🚀',
      color: '#3B82F6',
      order: 1,
    },
  });

  const projectManagementCategory = await prisma.knowledgeBaseCategory.create({
    data: {
      name: 'Project Management',
      description: 'Guide to managing projects and milestones',
      icon: '📊',
      color: '#10B981',
      order: 2,
    },
  });

  const billingCategory = await prisma.knowledgeBaseCategory.create({
    data: {
      name: 'Billing & Payments',
      description: 'Understand billing, invoices, and payments',
      icon: '💳',
      color: '#F59E0B',
      order: 3,
    },
  });

  const technicalCategory = await prisma.knowledgeBaseCategory.create({
    data: {
      name: 'Technical Support',
      description: 'Technical documentation and troubleshooting',
      icon: '🔧',
      color: '#EF4444',
      order: 4,
    },
  });

  // Create tags
  await Promise.all([
    prisma.kbTag.create({ data: { name: 'beginner', color: '#10B981' } }),
    prisma.kbTag.create({ data: { name: 'tutorial', color: '#3B82F6' } }),
    prisma.kbTag.create({ data: { name: 'setup', color: '#F59E0B' } }),
    prisma.kbTag.create({ data: { name: 'advanced', color: '#EF4444' } }),
    prisma.kbTag.create({
      data: { name: 'troubleshooting', color: '#8B5CF6' },
    }),
    prisma.kbTag.create({ data: { name: 'billing', color: '#EC4899' } }),
  ]);

  // Get or create a user for article author - require secure credentials
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables are required for seeding'
    );
  }

  // Validate password strength
  if (adminPassword.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters long');
  }

  let user = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'JasaWeb Admin',
        password: hashedPassword,
      },
    });
  }

  // Create articles
  const articles = [
    {
      title: 'Welcome to JasaWeb Platform',
      slug: 'welcome-to-jasaweb-platform',
      content: `
        <h1>Welcome to JasaWeb Platform</h1>
        <p>JasaWeb is a comprehensive client portal designed to streamline your web development projects. This guide will help you get started with the platform and understand its key features.</p>
        
        <h2>What is JasaWeb?</h2>
        <p>JasaWeb is a client management platform that provides:</p>
        <ul>
          <li>Project tracking and milestone management</li>
          <li>File sharing and version control</li>
          <li>Approval workflows</li>
          <li>Ticket and issue management</li>
          <li>Billing and invoice management</li>
        </ul>
        
        <h2>Getting Started</h2>
        <p>To get started with JasaWeb:</p>
        <ol>
          <li>Complete your organization profile</li>
          <li>Invite team members</li>
          <li>Create your first project</li>
          <li>Set up milestones and tasks</li>
        </ol>
        
        <h2>Next Steps</h2>
        <p>Check out our other articles to learn more about specific features:</p>
        <ul>
          <li><a href="/knowledge-base/article/creating-your-first-project">Creating Your First Project</a></li>
          <li><a href="/knowledge-base/article/managing-team-members">Managing Team Members</a></li>
          <li><a href="/knowledge-base/article/understanding-approvals">Understanding Approval Workflows</a></li>
        </ul>
      `,
      excerpt:
        'Get started with JasaWeb platform and learn about its key features for project management.',
      status: 'published' as const,
      featured: true,
      categoryId: gettingStartedCategory.id,
      authorId: user.id,
      tagNames: ['beginner', 'tutorial'],
    },
    {
      title: 'Creating Your First Project',
      slug: 'creating-your-first-project',
      content: `
        <h1>Creating Your First Project</h1>
        <p>Projects are the core of JasaWeb platform. Learn how to create and manage your first project.</p>
        
        <h2>Step 1: Navigate to Projects</h2>
        <p>From your dashboard, click on "Projects" in the navigation menu.</p>
        
        <h2>Step 2: Create New Project</h2>
        <p>Click the "New Project" button to open the project creation form.</p>
        
        <h2>Step 3: Fill Project Details</h2>
        <p>Provide the following information:</p>
        <ul>
          <li><strong>Project Name:</strong> A descriptive name for your project</li>
          <li><strong>Description:</strong> Brief overview of the project scope</li>
          <li><strong>Start Date:</strong> When the project begins</li>
          <li><strong>Due Date:</strong> Project deadline</li>
        </ul>
        
        <h2>Step 4: Set Up Milestones</h2>
        <p>Create key milestones to track project progress:</p>
        <ul>
          <li>Design Phase</li>
          <li>Development Phase</li>
          <li>Testing Phase</li>
          <li>Launch</li>
        </ul>
        
        <h2>Step 5: Invite Team Members</h2>
        <p>Add team members who will work on the project and assign appropriate roles.</p>
        
        <h2>Tips for Success</h2>
        <ul>
          <li>Break down large projects into smaller milestones</li>
          <li>Set realistic deadlines</li>
          <li>Regularly update project status</li>
          <li>Use the approval workflow for important decisions</li>
        </ul>
      `,
      excerpt:
        'Learn how to create your first project on JasaWeb platform with milestones and team collaboration.',
      status: 'published' as const,
      featured: true,
      categoryId: gettingStartedCategory.id,
      authorId: user.id,
      tagNames: ['tutorial', 'setup'],
    },
    {
      title: 'Understanding Approval Workflows',
      slug: 'understanding-approval-workflows',
      content: `
        <h1>Understanding Approval Workflows</h1>
        <p>Approval workflows ensure that important decisions and deliverables are reviewed before implementation.</p>
        
        <h2>What Can Be Approved?</h2>
        <ul>
          <li>Design mockups and wireframes</li>
          <li>Content and copy</li>
          <li>Feature implementations</li>
          <li>Project milestones</li>
        </ul>
        
        <h2>Creating an Approval Request</h2>
        <ol>
          <li>Navigate to the relevant project or item</li>
          <li>Click "Request Approval"</li>
          <li>Select the type of item being approved</li>
          <li>Add any notes or context</li>
          <li>Submit the request</li>
        </ol>
        
        <h2>Review Process</h1>
        <p>Approvers will receive notifications and can:</p>
        <ul>
          <li>Approve the request as-is</li>
          <li>Approve with changes</li>
          <li>Reject with feedback</li>
        </ul>
        
        <h2>Best Practices</h2>
        <ul>
          <li>Provide clear context in approval requests</li>
          <li>Set appropriate deadlines</li>
          <li>Follow up on pending approvals</li>
          <li>Document approval decisions</li>
        </ul>
      `,
      excerpt:
        'Learn how to use approval workflows to review and approve project deliverables.',
      status: 'published' as const,
      featured: false,
      categoryId: projectManagementCategory.id,
      authorId: user.id,
      tagNames: ['tutorial', 'advanced'],
    },
    {
      title: 'Managing Invoices and Payments',
      slug: 'managing-invoices-and-payments',
      content: `
        <h1>Managing Invoices and Payments</h1>
        <p>Learn how to handle billing, invoices, and payments within the JasaWeb platform.</p>
        
        <h2>Viewing Invoices</h2>
        <p>All your invoices are accessible from the Billing section:</p>
        <ol>
          <li>Go to Settings → Billing</li>
          <li>View your invoice history</li>
          <li>Click on any invoice to see details</li>
        </ol>
        
        <h2>Invoice Status</h2>
        <p>Invoices can have the following statuses:</p>
        <ul>
          <li><strong>Draft:</strong> Invoice is being prepared</li>
          <li><strong>Issued:</strong> Invoice sent to client</li>
          <li><strong>Paid:</strong> Payment received</li>
          <li><strong>Overdue:</strong> Payment deadline passed</li>
        </ul>
        
        <h2>Making Payments</h2>
        <p>To pay an invoice:</p>
        <ol>
          <li>Open the invoice details</li>
          <li>Click "Pay Now"</li>
          <li>Select payment method</li>
          <li>Complete payment process</li>
        </ol>
        
        <h2>Payment Methods</h2>
        <p>We accept various payment methods:</p>
        <ul>
          <li>Credit/Debit cards</li>
          <li>Bank transfers</li>
          <li>Digital wallets</li>
        </ul>
        
        <h2>Download Invoices</h2>
        <p>You can download PDF copies of all your invoices for your records.</p>
      `,
      excerpt:
        'Complete guide to managing invoices, payments, and billing in JasaWeb platform.',
      status: 'published' as const,
      featured: false,
      categoryId: billingCategory.id,
      authorId: user.id,
      tagNames: ['billing'],
    },
    {
      title: 'Troubleshooting Common Issues',
      slug: 'troubleshooting-common-issues',
      content: `
        <h1>Troubleshooting Common Issues</h1>
        <p>Solutions to common problems you might encounter while using JasaWeb.</p>
        
        <h2>Login Issues</h2>
        <h3>Forgot Password</h3>
        <p>Use the "Forgot Password" link on the login page to reset your password.</p>
        
        <h3>Account Locked</h3>
        <p>Contact support if your account is locked after multiple failed login attempts.</p>
        
        <h2>File Upload Problems</h2>
        <h3>File Size Limits</h3>
        <p>Maximum file size is 50MB. Compress large files before uploading.</p>
        
        <h3>Supported File Types</h3>
        <p>Common formats are supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF.</p>
        
        <h2>Project Management Issues</h2>
        <h3>Cannot Edit Project</h3>
        <p>Ensure you have the appropriate permissions. Contact your project admin.</p>
        
        <h3>Milestone Not Updating</h3>
        <p>Try refreshing the page or clearing your browser cache.</p>
        
        <h2>Notification Problems</h2>
        <h3>Not Receiving Emails</h3>
        <p>Check your spam folder and verify your email address in settings.</p>
        
        <h3>Too Many Notifications</h3>
        <p>Adjust your notification preferences in Settings → Notifications.</p>
        
        <h2>Performance Issues</h2>
        <h3>Slow Loading</h3>
        <p>Try these solutions:</p>
        <ul>
          <li>Clear browser cache</li>
          <li>Check internet connection</li>
          <li>Try a different browser</li>
          <li>Disable browser extensions</li>
        </ul>
        
        <h2>Still Need Help?</h2>
        <p>If you continue to experience issues:</p>
        <ul>
          <li>Check our knowledge base for more articles</li>
          <li>Create a support ticket</li>
          <li>Contact our support team</li>
        </ul>
      `,
      excerpt:
        'Solutions to common technical issues and problems in JasaWeb platform.',
      status: 'published' as const,
      featured: false,
      categoryId: technicalCategory.id,
      authorId: user.id,
      tagNames: ['troubleshooting', 'beginner'],
    },
  ];

  for (const articleData of articles) {
    await prisma.kbArticle.create({
      data: {
        ...articleData,
        publishedAt: new Date(),
      },
    });
  }

  logger.info('Knowledge base seed data created successfully');
}

main()
  .catch((e) => {
    logger.error('Error seeding knowledge base data', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
