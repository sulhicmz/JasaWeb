import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let mockService: {
    getProjectAnalytics: ReturnType<typeof vi.fn>;
    [key: string]: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockService = {
      getProjectAnalytics: vi.fn().mockResolvedValue({
        summary: {
          totalProjects: 10,
          completedProjects: 5,
          inProgressProjects: 3,
          overdueProjects: 2,
          completionRate: 50,
          onTimeDeliveryRate: 80,
        },
        milestones: {
          total: 20,
          completed: 15,
          completionRate: 75,
        },
        tasks: {
          total: 50,
          completed: 30,
          completionRate: 60,
        },
      }),
      getTeamPerformanceAnalytics: vi.fn().mockResolvedValue([]),
      getFinancialAnalytics: vi.fn().mockResolvedValue({
        summary: {
          totalInvoices: 5,
          totalAmount: 10000,
          paidAmount: 8000,
          outstandingAmount: 2000,
          paymentRate: 80,
          overdueCount: 1,
        },
        byCurrency: {},
        byMonth: {},
      }),
      getTeamPerformanceAnalytics: vi.fn().mockResolvedValue([]),
      getFinancialAnalytics: vi.fn().mockResolvedValue({
        summary: {
          totalInvoices: 5,
          totalAmount: 10000,
          paidAmount: 8000,
          outstandingAmount: 2000,
          paymentRate: 80,
          overdueCount: 1,
        },
        byCurrency: {},
        byMonth: {},
      }),
      getClientInsightsAnalytics: vi.fn().mockResolvedValue({
        summary: {
          totalTickets: 15,
          resolvedTickets: 12,
          resolutionRate: 80,
          slaComplianceRate: 75,
        },
        byType: {},
        byPriority: {
          critical: { total: 2, resolved: 1 },
          high: { total: 5, resolved: 4 },
          medium: { total: 6, resolved: 5 },
          low: { total: 2, resolved: 2 },
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjectAnalytics', () => {
    it('should return project analytics', async () => {
      // Call the method directly with organizationId
      const result = await (controller as any).getProjectAnalytics(
        'org-123',
        {}
      );
      expect(mockService.getProjectAnalytics).toHaveBeenCalledWith(
        'org-123',
        {}
      );
      expect(result).toEqual({
        summary: {
          totalProjects: 10,
          completedProjects: 5,
          inProgressProjects: 3,
          overdueProjects: 2,
          completionRate: 50,
          onTimeDeliveryRate: 80,
        },
        milestones: {
          total: 20,
          completed: 15,
          completionRate: 75,
        },
        tasks: {
          total: 50,
          completed: 30,
          completionRate: 60,
        },
      });
    });
  });

  describe('getOverviewAnalytics', () => {
    it('should return overview analytics', async () => {
      const result = await (controller as any).getOverviewAnalytics(
        'org-123',
        {}
      );
      expect(mockService.getProjectAnalytics).toHaveBeenCalledWith(
        'org-123',
        {}
      );
      expect(result).toEqual({
        projects: {
          summary: {
            totalProjects: 10,
            completedProjects: 5,
            inProgressProjects: 3,
            overdueProjects: 2,
            completionRate: 50,
            onTimeDeliveryRate: 80,
          },
          milestones: { total: 20, completed: 15, completionRate: 75 },
          tasks: { total: 50, completed: 30, completionRate: 60 },
        },
        teamPerformance: [],
        financial: {
          summary: {
            totalInvoices: 5,
            totalAmount: 10000,
            paidAmount: 8000,
            outstandingAmount: 2000,
            paymentRate: 80,
            overdueCount: 1,
          },
          byCurrency: {},
          byMonth: {},
        },
        clientInsights: {
          summary: {
            totalTickets: 15,
            resolvedTickets: 12,
            resolutionRate: 80,
            slaComplianceRate: 75,
          },
          byType: {},
          byPriority: {
            critical: { total: 2, resolved: 1 },
            high: { total: 5, resolved: 4 },
            medium: { total: 6, resolved: 5 },
            low: { total: 2, resolved: 2 },
          },
        },
      });
    });
  });
});
