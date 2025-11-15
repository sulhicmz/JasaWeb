import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { EmailService } from '../common/services/email.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService
  ) {}

  async startOnboarding(userId: string, organizationId: string) {
    // Check if user has permission
    await this.validateUserPermission(userId, organizationId);

    // Check if onboarding already exists
    const existingOnboarding = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        actorId: userId,
        action: 'onboarding_started',
      },
    });

    if (existingOnboarding) {
      return { message: 'Onboarding already started', step: 'in_progress' };
    }

    // Create onboarding record
    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'onboarding_started',
      target: 'Onboarding',
      meta: {
        startedAt: new Date().toISOString(),
        step: 'welcome',
      },
    });

    return {
      message: 'Onboarding started successfully',
      step: 'welcome',
      progress: 0,
    };
  }

  async completeOnboarding(
    userId: string,
    organizationId: string,
    completeOnboardingDto: any
  ) {
    await this.validateUserPermission(userId, organizationId);

    // Get organization
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Update organization with onboarding data
    const updatedOrganization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          ...organization.settings,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          onboardingData: completeOnboardingDto,
        },
      },
    });

    // Log completion
    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'onboarding_completed',
      target: 'Onboarding',
      meta: {
        completedAt: new Date().toISOString(),
        totalDuration: this.calculateOnboardingDuration(userId, organizationId),
      },
    });

    // Send completion email
    await this.sendOnboardingCompletionEmail(userId, organizationId);

    // Unlock completion achievement
    await this.unlockAchievementInternal(userId, organizationId, 'completion');

    return {
      message: 'Onboarding completed successfully',
      organization: updatedOrganization,
    };
  }

  async updateProgress(
    userId: string,
    organizationId: string,
    step: string,
    data: any
  ) {
    await this.validateUserPermission(userId, organizationId);

    // Log progress update
    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'onboarding_progress_updated',
      target: 'Onboarding',
      meta: {
        step,
        data,
        timestamp: new Date().toISOString(),
      },
    });

    // Check for step-specific achievements
    await this.checkStepAchievements(userId, organizationId, step);

    return {
      message: 'Progress updated successfully',
      step,
      progress: this.calculateProgress(step),
    };
  }

  async getOnboardingStatus(userId: string, organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          where: { userId },
          include: { user: true },
        },
        projects: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const isCompleted = organization.settings?.onboardingCompleted || false;
    const projectCount = organization.projects.length;

    // Get onboarding progress from audit logs
    const progressLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        action: { startsWith: 'onboarding_' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentStep = this.determineCurrentStep(progressLogs);
    const progress = this.calculateProgress(currentStep);

    return {
      isCompleted,
      currentStep,
      progress,
      projectCount,
      hasProjects: projectCount > 0,
      completedAt: organization.settings?.onboardingCompletedAt,
      settings: organization.settings,
    };
  }

  async updateOrganization(
    userId: string,
    organizationId: string,
    organizationDto: any
  ) {
    await this.validateUserPermission(userId, organizationId);

    const updatedOrganization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: organizationDto.name,
        billingEmail: organizationDto.email,
        settings: {
          ...(await this.getOrganizationSettings(organizationId)),
          timezone: organizationDto.timezone,
          autoMilestones: organizationDto.autoMilestones,
          weeklyReports: organizationDto.weeklyReports,
          slackNotifications: organizationDto.slackNotifications,
        },
      },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'onboarding_organization_updated',
      target: 'Organization',
      meta: organizationDto,
    });

    return {
      message: 'Organization updated successfully',
      organization: updatedOrganization,
    };
  }

  async inviteTeamMembers(
    userId: string,
    organizationId: string,
    members: Array<{ email: string; role: string }>
  ) {
    await this.validateUserPermission(userId, organizationId);

    const invitations = [];

    for (const member of members) {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: member.email },
      });

      if (existingUser) {
        // Create membership if not exists
        const existingMembership = await this.prisma.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId,
            },
          },
        });

        if (!existingMembership) {
          await this.prisma.membership.create({
            data: {
              userId: existingUser.id,
              organizationId,
              role: member.role,
            },
          });
        }

        invitations.push({
          email: member.email,
          status: 'existing_user',
          role: member.role,
        });
      } else {
        // Create invitation record (you might want to create a separate invitations table)
        invitations.push({
          email: member.email,
          status: 'invited',
          role: member.role,
        });

        // Send invitation email
        await this.emailService.sendInvitationEmail(
          member.email,
          organizationId,
          member.role
        );
      }
    }

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'onboarding_team_invited',
      target: 'Team',
      meta: { members, invitationsCount: members.length },
    });

    return {
      message: 'Team invitations sent successfully',
      invitations,
    };
  }

  async createFirstProject(
    userId: string,
    organizationId: string,
    projectDto: any
  ) {
    await this.validateUserPermission(userId, organizationId);

    // Get template details if specified
    let milestones = [];
    if (projectDto.template) {
      const template = await this.getProjectTemplateDetails(
        projectDto.template
      );
      milestones = template.milestones.map((title: string, index: number) => ({
        title,
        status: 'todo',
        dueAt: this.calculateMilestoneDueDate(index, template.duration),
      }));
    }

    const project = await this.prisma.project.create({
      data: {
        organizationId,
        name: projectDto.name,
        status: 'draft',
        startAt: projectDto.startDate ? new Date(projectDto.startDate) : null,
        dueAt: projectDto.endDate ? new Date(projectDto.endDate) : null,
        milestones: {
          create: milestones,
        },
      },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'onboarding_project_created',
      target: 'Project',
      meta: {
        projectId: project.id,
        projectName: project.name,
        template: projectDto.template,
      },
    });

    return {
      message: 'First project created successfully',
      project,
    };
  }

  async getProjectTemplates() {
    return {
      templates: [
        {
          id: 'school',
          name: 'Website Sekolah',
          description: 'Template lengkap untuk website institusi pendidikan',
          icon: '🏫',
          duration: '2-3 bulan',
          milestones: 15,
          features: [
            'Halaman Beranda',
            'Profil Sekolah',
            'Informasi PPDB',
            'Galeri Foto',
            'Berita & Pengumuman',
            'Kontak & Lokasi',
          ],
        },
        {
          id: 'portal',
          name: 'Portal Berita',
          description: 'Template untuk portal berita dan konten',
          icon: '📰',
          duration: '1-2 bulan',
          milestones: 10,
          features: [
            'Halaman Utama',
            'Kategori Berita',
            'Artikel Detail',
            'Pencarian',
            'Komentar',
            'Newsletter',
          ],
        },
        {
          id: 'company',
          name: 'Company Profile',
          description: 'Template profesional untuk website perusahaan',
          icon: '🏢',
          duration: '1-2 bulan',
          milestones: 8,
          features: [
            'Landing Page',
            'Tentang Kami',
            'Layanan',
            'Portfolio',
            'Tim',
            'Kontak',
          ],
        },
        {
          id: 'ecommerce',
          name: 'E-Commerce',
          description: 'Template toko online lengkap',
          icon: '🛒',
          duration: '2-3 bulan',
          milestones: 20,
          features: [
            'Katalog Produk',
            'Shopping Cart',
            'Checkout',
            'Payment Gateway',
            'User Account',
            'Order Tracking',
          ],
        },
        {
          id: 'custom',
          name: 'Custom Project',
          description: 'Mulai dari awal dengan konfigurasi kustom',
          icon: '🎨',
          duration: 'Flexible',
          milestones: 0,
          features: [
            'Desain Kustom',
            'Fitur Kustom',
            'Integrasi Kustom',
            'API Development',
            'Maintenance',
            'Support',
          ],
        },
      ],
    };
  }

  async getTemplateDetails(templateId: string) {
    const template = await this.getProjectTemplateDetails(templateId);
    return { template };
  }

  async unlockAchievement(
    userId: string,
    organizationId: string,
    achievementId: string
  ) {
    await this.validateUserPermission(userId, organizationId);

    const achievement = await this.unlockAchievementInternal(
      userId,
      organizationId,
      achievementId
    );

    return { message: 'Achievement unlocked', achievement };
  }

  async getUserAchievements(userId: string, organizationId: string) {
    const achievements = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        actorId: userId,
        action: 'achievement_unlocked',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      achievements: achievements.map((log) => ({
        id: log.meta?.achievementId,
        name: log.meta?.name,
        icon: log.meta?.icon,
        description: log.meta?.description,
        unlockedAt: log.createdAt,
      })),
    };
  }

  // Private helper methods
  private async validateUserPermission(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new BadRequestException('Insufficient permissions');
    }
  }

  private async getOrganizationSettings(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    return organization?.settings || {};
  }

  private determineCurrentStep(progressLogs: any[]): string {
    const steps = [
      'welcome',
      'organization',
      'team',
      'project',
      'integrations',
      'complete',
    ];

    for (const step of steps.reverse()) {
      const hasCompletedStep = progressLogs.some(
        (log) =>
          log.action === 'onboarding_progress_updated' &&
          log.meta?.step === step
      );

      if (hasCompletedStep) {
        return step;
      }
    }

    return 'welcome';
  }

  private calculateProgress(currentStep: string): number {
    const stepProgress = {
      welcome: 0,
      organization: 20,
      team: 40,
      project: 60,
      integrations: 80,
      complete: 100,
    };

    return stepProgress[currentStep] || 0;
  }

  private async getProjectTemplateDetails(templateId: string) {
    const templates = {
      school: {
        name: 'Website Sekolah',
        duration: 75, // days
        milestones: [
          'Kick-off Meeting & Requirements Gathering',
          'UI/UX Design & Mockup Creation',
          'Homepage Development',
          'School Profile Pages',
          'PPDB Information System',
          'Photo Gallery Implementation',
          'News & Announcement System',
          'Contact & Location Pages',
          'Responsive Design Implementation',
          'Content Management Setup',
          'Testing & Quality Assurance',
          'Client Training & Documentation',
          'Deployment & Go-Live',
          'Post-Launch Support (1 week)',
          'Project Handover',
        ],
      },
      portal: {
        name: 'Portal Berita',
        duration: 45,
        milestones: [
          'Requirements & Design Planning',
          'Database Schema Design',
          'Homepage Layout Development',
          'Category Management System',
          'Article Creation & Editing',
          'Search Implementation',
          'Comment System',
          'Newsletter Subscription',
          'Testing & Optimization',
          'Launch & Deployment',
        ],
      },
      company: {
        name: 'Company Profile',
        duration: 45,
        milestones: [
          'Discovery & Planning',
          'Design Concept Creation',
          'Landing Page Development',
          'About Us Pages',
          'Services Section',
          'Portfolio Showcase',
          'Team & Contact Pages',
          'Final Testing & Launch',
        ],
      },
      ecommerce: {
        name: 'E-Commerce',
        duration: 75,
        milestones: [
          'Business Analysis & Planning',
          'UI/UX Design',
          'Product Catalog Setup',
          'Shopping Cart Development',
          'User Account System',
          'Checkout Process',
          'Payment Gateway Integration',
          'Order Management',
          'Admin Panel Development',
          'Search & Filter System',
          'Review & Rating System',
          'Wishlist Implementation',
          'Email Notification System',
          'Mobile Responsiveness',
          'Performance Optimization',
          'Security Implementation',
          'Testing Phase',
          'Content Migration',
          'Training & Documentation',
          'Launch & Support',
        ],
      },
      custom: {
        name: 'Custom Project',
        duration: 60,
        milestones: [
          'Custom requirements gathering',
          'Tailored design process',
          'Custom feature development',
          'Specific integrations',
          'API development as needed',
          'Flexible timeline management',
          'Custom testing procedures',
          'Ongoing maintenance plan',
        ],
      },
    };

    return templates[templateId] || templates.custom;
  }

  private calculateMilestoneDueDate(
    index: number,
    totalDuration: number
  ): Date {
    const daysPerMilestone = totalDuration / 15; // Average 15 milestones
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (index + 1) * daysPerMilestone);
    return dueDate;
  }

  private async checkStepAchievements(
    userId: string,
    organizationId: string,
    step: string
  ) {
    const achievements = {
      organization: 'first_steps',
      team: 'team_builder',
      project: 'project_creator',
      integrations: 'integrator',
    };

    const achievementId = achievements[step];
    if (achievementId) {
      await this.unlockAchievementInternal(
        userId,
        organizationId,
        achievementId
      );
    }
  }

  private async unlockAchievementInternal(
    userId: string,
    organizationId: string,
    achievementId: string
  ) {
    const achievementData = this.getAchievementData(achievementId);

    // Check if already unlocked
    const existing = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        actorId: userId,
        action: 'achievement_unlocked',
        meta: { achievementId },
      },
    });

    if (existing) {
      return existing.meta;
    }

    // Log achievement unlock
    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'achievement_unlocked',
      target: 'Achievement',
      meta: achievementData,
    });

    return achievementData;
  }

  private getAchievementData(achievementId: string) {
    const achievements = {
      first_steps: {
        achievementId: 'first_steps',
        name: 'Langkah Pertama',
        icon: '🎯',
        description: 'Menyelesaikan langkah pertama onboarding',
      },
      team_builder: {
        achievementId: 'team_builder',
        name: 'Team Builder',
        icon: '👥',
        description: 'Mengundang anggota tim pertama',
      },
      project_creator: {
        achievementId: 'project_creator',
        name: 'Project Creator',
        icon: '📋',
        description: 'Membuat proyek pertama',
      },
      integrator: {
        achievementId: 'integrator',
        name: 'Integrator',
        icon: '🔗',
        description: 'Mengatur integrasi pertama',
      },
      halfway: {
        achievementId: 'halfway',
        name: 'Setengah Jalan',
        icon: '⭐',
        description: 'Menyelesaikan 50% onboarding',
      },
      completion: {
        achievementId: 'completion',
        name: 'Onboarding Master',
        icon: '🏆',
        description: 'Menyelesaikan seluruh onboarding',
      },
      quick_starter: {
        achievementId: 'quick_starter',
        name: 'Quick Starter',
        icon: '⚡',
        description: 'Menyelesaikan onboarding dalam 10 menit',
      },
    };

    return achievements[achievementId] || achievements.first_steps;
  }

  private calculateOnboardingDuration(
    userId: string,
    organizationId: string
  ): number {
    // This would calculate the total duration from start to completion
    // For now, return a placeholder
    return 0;
  }

  private async sendOnboardingCompletionEmail(
    userId: string,
    organizationId: string
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (user && organization) {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Selamat! Onboarding JasaWeb Selesai',
        template: 'onboarding-completed',
        data: {
          userName: user.name,
          organizationName: organization.name,
        },
      });
    }
  }
}
