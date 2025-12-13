/// <reference types="@types/jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(async () => {
    const mockService = {
      getProjectAnalytics: jest.fn(),
      getTeamPerformanceAnalytics: jest.fn(),
      getFinancialAnalytics: jest.fn(),
      getClientInsightsAnalytics: jest.fn(),
      getActivityTrends: jest.fn(),
      getOverviewAnalytics: jest.fn(),
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

      jest
        .spyOn(service, 'getProjectAnalytics')
        .mockResolvedValue(mockAnalytics);

      const result = await controller.getProjectAnalytics('org-123');

      expect(service.getProjectAnalytics).toHaveBeenCalledWith('org-123', {});
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getOverviewAnalytics', () => {
    it('should return overview analytics', async () => {
      const mockProjects = {
        summary: {
          totalProjects: 10,
          completedProjects: 3,
          inProgressProjects: 6,
          overdueProjects: 1,
          completionRate: 30,
          onTimeDeliveryRate: 85,
        },
        milestones: {
          total: 25,
          completed: 20,
          completionRate: 80,
        },
        tasks: {
          total: 50,
          completed: 40,
          completionRate: 80,
        },
      };
      const mockTeamPerformance = [
        {
          userId: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'developer',
          tasks: {
            total: 10,
            completed: 8,
            completionRate: 80,
          },
          approvals: {
            total: 5,
            completed: 4,
            completionRate: 80,
          },
          tickets: {
            total: 8,
            resolved: 6,
            resolutionRate: 75,
          },
        },
      ];
      const mockFinancial = {
        summary: {
          totalInvoices: 15,
          totalAmount: 50000,
          paidAmount: 35000,
          outstandingAmount: 15000,
          paymentRate: 70,
          overdueCount: 3,
        },
        byCurrency: {
          USD: { count: 12, amount: 40000, paid: 28000 },
          EUR: { count: 3, amount: 10000, paid: 7000 },
        },
        byMonth: {
          '2024-01': { count: 5, amount: 15000, paid: 12000 },
          '2024-02': { count: 6, amount: 20000, paid: 14000 },
        },
      };
      const mockClientInsights = {
        summary: {
          totalTickets: 25,
          resolvedTickets: 20,
          resolutionRate: 80,
          slaComplianceRate: 85,
        },
        byType: {
          bug: { total: 10, resolved: 8 },
          feature: { total: 8, resolved: 7 },
          support: { total: 7, resolved: 5 },
        },
        byPriority: {
          critical: { total: 2, resolved: 2 },
          high: { total: 5, resolved: 4 },
          medium: { total: 10, resolved: 8 },
          low: { total: 8, resolved: 6 },
        },
      };

      jest
        .spyOn(service, 'getProjectAnalytics')
        .mockResolvedValue(mockProjects);
      jest
        .spyOn(service, 'getTeamPerformanceAnalytics')
        .mockResolvedValue(mockTeamPerformance);
      jest
        .spyOn(service, 'getFinancialAnalytics')
        .mockResolvedValue(mockFinancial);
      jest
        .spyOn(service, 'getClientInsightsAnalytics')
        .mockResolvedValue(mockClientInsights);

      const result = await controller.getOverviewAnalytics('org-123');

      expect(service.getProjectAnalytics).toHaveBeenCalledWith('org-123', {});
      expect(service.getTeamPerformanceAnalytics).toHaveBeenCalledWith(
        'org-123',
        {}
      );
      expect(service.getFinancialAnalytics).toHaveBeenCalledWith('org-123', {});
      expect(service.getClientInsightsAnalytics).toHaveBeenCalledWith(
        'org-123',
        {}
      );
      expect(result).toEqual({
        projects: mockProjects,
        teamPerformance: mockTeamPerformance,
        financial: mockFinancial,
        clientInsights: mockClientInsights,
      });
    });
  });
});
