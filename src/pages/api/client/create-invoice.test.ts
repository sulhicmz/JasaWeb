/**
 * Create Invoice API Integration Tests
 * Tests invoice creation with authentication, rate limiting, idempotency, and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Invoice, Project, PricingPlan } from '@prisma/client';

// Mock all dependencies before importing routes
const mockPrisma = {
    project: {
        findFirst: vi.fn(),
    },
    pricingPlan: {
        findUnique: vi.fn(),
    },
    invoice: {
        create: vi.fn(),
    },
    $disconnect: vi.fn(),
} as any;

const mockCheckRateLimit = vi.fn();
const mockCreatePrismaClient = vi.fn();
const mockFormatPrice = vi.fn();
const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
};

vi.mock('@/lib/prisma', () => ({
    createPrismaClient: mockCreatePrismaClient,
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: mockCheckRateLimit,
}));

vi.mock('@/lib/config', () => ({
    formatPrice: mockFormatPrice,
}));

vi.mock('@/lib/logger', () => ({
    logger: mockLogger,
}));

describe('Create Invoice API - Integration', () => {
    let mockUser: any;
    let mockProject: Project & { invoices: Invoice[] };
    let mockPricing: PricingPlan;
    let mockInvoice: Invoice & { project: Project };
    let mockLocals: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUser = {
            id: 'user-123',
            email: 'client@example.com',
            name: 'Test Client',
            role: 'client',
        };

        mockProject = {
            id: 'project-123',
            name: 'Test Project',
            type: 'sekolah' as const,
            userId: 'user-123',
            status: 'pending_payment' as const,
            url: null,
            credentials: null,
            createdAt: new Date('2024-01-01'),
            invoices: [],
        } as any;

        mockPricing = {
            id: 'pricing-123',
            identifier: 'sekolah',
            name: 'School Package',
            price: 500000,  // Use number directly, Number() will handle conversion
            description: 'School website package',
            features: [],
            popular: false,
            color: 'primary' as const,
            sortOrder: 1,
            isActive: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as any;

        mockInvoice = {
            id: 'invoice-123',
            projectId: 'project-123',
            amount: 500000 as any,  // Use number instead of Decimal mock
            status: 'unpaid' as const,
            midtransOrderId: null,
            qrisUrl: null,
            paidAt: null,
            createdAt: new Date('2024-01-01'),
            project: mockProject,
        } as any;

        mockLocals = {
            user: mockUser,
            runtime: {
                env: {
                    DATABASE_URL: 'test-db-url',
                    MIDTRANS_SERVER_KEY: 'test-server-key',
                    MIDTRANS_CLIENT_KEY: 'test-client-key',
                    MIDTRANS_IS_PRODUCTION: 'false',
                    CACHE: {
                        get: vi.fn(),
                        put: vi.fn(),
                    },
                },
            },
        };

        mockCreatePrismaClient.mockReturnValue(mockPrisma);
        mockCheckRateLimit.mockResolvedValue(null);
        mockFormatPrice.mockReturnValue('Rp 500.000');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Happy Path', () => {
        it('should create invoice successfully with valid request', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.pricingPlan.findUnique.mockResolvedValue(mockPricing);
            // Use mockImplementation to return invoice with the amount that was passed
            mockPrisma.invoice.create.mockImplementation((data: any) => {
                const createdInvoice = {
                    ...mockInvoice,
                    amount: data.data.amount,  // Use the amount passed to create()
                };
                return Promise.resolve(createdInvoice);
            });

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data.invoice).toBeDefined();
            expect(result.data.invoice.id).toBe('invoice-123');
            expect(result.data.pricing).toEqual({
                type: 'School Package',
                amount: 500000,
                amountFormatted: 'Rp 500.000',
            });
            expect(result.data.message).toBe('Invoice berhasil dibuat. Lanjutkan ke pembayaran.');

            expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
                data: {
                    projectId: 'project-123',
                    amount: 500000,
                    status: 'unpaid',
                },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            userId: true,
                        },
                    },
                },
            });

            expect(mockLogger.info).toHaveBeenCalledWith('Invoice created', {
                invoiceId: 'invoice-123',
                projectId: 'project-123',
                userId: 'user-123',
            });
        });

        it('should return existing unpaid invoice for idempotency', async () => {
            const existingInvoice = {
                id: 'invoice-existing',
                projectId: 'project-123',
                amount: { toNumber: () => 500000 } as any,
                status: 'unpaid' as const,
            };
            const projectWithUnpaidInvoice = {
                ...mockProject,
                invoices: [existingInvoice],
            };

            mockPrisma.project.findFirst.mockResolvedValue(projectWithUnpaidInvoice);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data.invoice.id).toBe('invoice-existing');
            expect(result.data.duplicate).toBe(true);
            expect(result.data.message).toBe('Invoice sudah ada. Gunakan invoice yang ada atau hubungi admin.');
            expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
        });
    });

    describe('Authentication & Authorization', () => {
        it('should return 401 when user is not authenticated', async () => {
            mockLocals.user = null;

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('should apply rate limiting to prevent abuse', async () => {
            const rateLimitResponse = new Response(
                JSON.stringify({ error: 'Too many requests' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
            mockCheckRateLimit.mockResolvedValue(rateLimitResponse);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(429);
            expect(mockCheckRateLimit).toHaveBeenCalledWith(
                request,
                mockLocals.runtime.env.CACHE,
                'create-invoice',
                { limit: 5, window: 60 }
            );
        });
    });

    describe('Input Validation', () => {
        it('should return 400 when projectId is missing', async () => {
            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('projectId');
        });

        it('should return 400 when projectId is empty string', async () => {
            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: '' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('projectId');
        });

        it('should handle invalid JSON in request body', async () => {
            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json',
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('Business Logic Validation', () => {
        it('should return 404 when project does not exist', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'nonexistent' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('Project tidak ditemukan');
        });

        it('should return 404 when project belongs to different user', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(null);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('Project tidak ditemukan');
        });

        it('should return 400 when pricing plan for project type not found', async () => {
            const invalidTypeProject = {
                ...mockProject,
                type: 'invalid_type' as const,
            };
            mockPrisma.project.findFirst.mockResolvedValue(invalidTypeProject);
            mockPrisma.pricingPlan.findUnique.mockResolvedValue(null);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Tipe project tidak valid');
            expect(mockPrisma.pricingPlan.findUnique).toHaveBeenCalledWith({
                where: { identifier: 'invalid_type' },
            });
        });

        it('should calculate correct amount from pricing plan', async () => {
            const highPricing = {
                ...mockPricing,
                price: 750000,  // Use number directly, Number() will handle conversion
            };

            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.pricingPlan.findUnique.mockResolvedValue(highPricing);
            // Use mockImplementation to return invoice with amount that was passed
            mockPrisma.invoice.create.mockImplementation((data: any) => {
                const createdInvoice = {
                    ...mockInvoice,
                    amount: data.data.amount,  // Use the amount passed to create()
                };
                return Promise.resolve(createdInvoice);
            });
            mockFormatPrice.mockReturnValue('Rp 750.000');

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.data.pricing.amount).toBe(750000);
            expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
                data: {
                    projectId: 'project-123',
                    amount: 750000,
                    status: 'unpaid',
                },
                include: expect.any(Object),
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            mockPrisma.project.findFirst.mockRejectedValue(new Error('Database connection failed'));

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe('Terjadi kesalahan server');
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });

        it('should handle pricing plan lookup errors', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.pricingPlan.findUnique.mockRejectedValue(new Error('Pricing service unavailable'));

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(500);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });

        it('should handle invoice creation errors', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.pricingPlan.findUnique.mockResolvedValue(mockPricing);
            mockPrisma.invoice.create.mockRejectedValue(new Error('Failed to create invoice'));

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(response.status).toBe(500);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should skip rate limiting when CACHE is not available', async () => {
            mockLocals.runtime.env = {};
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.pricingPlan.findUnique.mockResolvedValue(mockPricing);
            mockPrisma.invoice.create.mockResolvedValue(mockInvoice);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            expect(mockCheckRateLimit).not.toHaveBeenCalled();
            expect(response.status).toBe(200);
        });

        it('should handle project with no existing invoices', async () => {
            mockPrisma.project.findFirst.mockResolvedValue(mockProject);
            mockPrisma.pricingPlan.findUnique.mockResolvedValue(mockPricing);
            mockPrisma.invoice.create.mockResolvedValue(mockInvoice);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.data.invoice).toBeDefined();
            expect(mockPrisma.invoice.create).toHaveBeenCalled();
        });

        it('should handle project with only paid invoices (create new invoice)', async () => {
            const paidInvoice = {
                id: 'inv-paid',
                projectId: 'project-123',
                amount: { toNumber: () => 500000 } as any,
                status: 'paid' as const,
            };
            const projectWithPaidInvoices = {
                ...mockProject,
                invoices: [paidInvoice],
            };
            const newInvoice = {
                ...mockInvoice,
                id: 'inv-new',
            };

            mockPrisma.project.findFirst.mockResolvedValue(projectWithPaidInvoices);
            mockPrisma.pricingPlan.findUnique.mockResolvedValue(mockPricing);
            mockPrisma.invoice.create.mockResolvedValue(newInvoice);

            const { POST: createInvoiceHandler } = await import('@/pages/api/client/create-invoice');

            const request = new Request('http://localhost/api/client/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: 'project-123' }),
            });

            const response = await createInvoiceHandler({ request, locals: mockLocals } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.data.invoice.id).toBe('inv-new');
            expect(mockPrisma.invoice.create).toHaveBeenCalled();
        });
    });
});
