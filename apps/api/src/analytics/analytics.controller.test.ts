import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(async () => {
    const mockService = {
      getProjectAnalytics: vi.fn(),
      getTeamPerformanceAnalytics: vi.fn(),
      getFinancialAnalytics: vi.fn(),
      getClientInsightsAnalytics: vi.fn(),
      getActivityTrends: vi.fn(),
      getOverviewAnalytics: vi.fn(),
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
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjectAnalytics', () => {
    it('should return project analytics', async () => {
      const mockAnalytics = {
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
      };

      vi.spyOn(service, 'getProjectAnalytics').mockResolvedValue(mockAnalytics);

      const result = await controller.getProjectAnalytics('org-123');

      expect(service.getProjectAnalytics).toHaveBeenCalledWith('org-123', {});
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getOverviewAnalytics', () => {
    it('should return overview analytics', async () => {
      const mockOverview = {
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
      };

      vi.spyOn(service, 'getOverviewAnalytics').mockResolvedValue(mockOverview);

      const result = await controller.getOverviewAnalytics('org-123');

      expect(service.getOverviewAnalytics).toHaveBeenCalledWith('org-123', {});
      expect(result).toEqual(mockOverview);
    });
  });
});
