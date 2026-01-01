import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessIntelligenceService } from './bi';

// Mock types
type PrismaClient = any;
type KVNamespace = any;

describe('BusinessIntelligenceService', () => {
    let service: BusinessIntelligenceService;
    let prisma: PrismaClient;
    let kv: KVNamespace;

    const mockInvoices = [
        { amount: 100, paidAt: new Date('2023-01-01'), project: { type: 'sekolah' } },
        { amount: 200, paidAt: new Date('2023-01-15'), project: { type: 'company' } },
        { amount: 300, paidAt: new Date('2023-02-01'), project: { type: 'sekolah' } },
    ];

    const mockUsers = [
        { createdAt: new Date('2023-01-01') },
        { createdAt: new Date('2023-01-15') },
        { createdAt: new Date('2023-02-01') },
    ];

    const mockProjects = [
        { status: 'completed', type: 'sekolah', userId: 'user1', updatedAt: new Date() },
        { status: 'in_progress', type: 'company', userId: 'user2', updatedAt: new Date() },
    ];

    beforeEach(() => {
        prisma = {
            invoice: {
                findMany: vi.fn().mockResolvedValue(mockInvoices),
                aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 600 } }),
                count: vi.fn().mockResolvedValue(0),
            },
            user: {
                findMany: vi.fn().mockResolvedValue(mockUsers),
                count: vi.fn().mockResolvedValue(3),
            },
            project: {
                count: vi.fn().mockResolvedValue(2),
                groupBy: vi.fn().mockResolvedValue([]),
                findMany: vi.fn().mockResolvedValue(mockProjects),
            },
            auditLog: {
                findMany: vi.fn().mockResolvedValue([]),
            }
        };

        // Partial mock for KV
        kv = {
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        };

        service = new BusinessIntelligenceService(prisma, kv);
    });

    describe('getRevenueAnalytics', () => {
        it('should calculate revenue by period correctly', async () => {
            const result = await service.getRevenueAnalytics('monthly');

            expect(result.totalRevenue).toBe(600);
            expect(result.revenueByPeriod).toEqual([
                { date: '2023-01', amount: 300 },
                { date: '2023-02', amount: 300 },
            ]);
            expect(result.averageRevenuePerUser).toBe(200); // 600 / 3
        });

        it('should calculate revenue by project type correctly', async () => {
            const result = await service.getRevenueAnalytics('monthly');

            expect(result.revenueByProjectType).toHaveLength(2);
            // Check content loosely as order might vary if map doesn't guarantee insertion order in all envs (it does in ES6)
            const sekolah = result.revenueByProjectType.find(r => r.type === 'sekolah');
            const company = result.revenueByProjectType.find(r => r.type === 'company');

            expect(sekolah).toBeDefined();
            expect(sekolah?.amount).toBe(400); // 100 + 300
            expect(company).toBeDefined();
            expect(company?.amount).toBe(200);
        });
    });

    describe('getUserGrowthAnalytics', () => {
        it('should calculate user growth by period', async () => {
            const result = await service.getUserGrowthAnalytics('monthly');

            expect(result.totalUsers).toBe(3);
            expect(result.newUsersByPeriod).toEqual([
                { date: '2023-01', count: 2 },
                { date: '2023-02', count: 1 },
            ]);
        });
    });

    describe('getProjectAnalytics', () => {
        it('should return project stats', async () => {
            // Mock groupBy responses
            prisma.project.groupBy.mockImplementation(async (args: any) => {
                if (args.by.includes('status')) {
                    return [
                        { status: 'completed', _count: { status: 1 } },
                        { status: 'in_progress', _count: { status: 1 } },
                    ];
                }
                if (args.by.includes('type')) {
                    return [
                        { type: 'sekolah', _count: { type: 1 } },
                        { type: 'company', _count: { type: 1 } },
                    ];
                }
                return [];
            });

            const result = await service.getProjectAnalytics();

            expect(result.totalProjects).toBe(2);
            expect(result.projectsByStatus).toHaveLength(2);
            expect(result.projectsByType).toHaveLength(2);
        });
    });
});
