/**
 * Shared Type Definitions
 */

// Re-export config types
export type { ServiceId, ServiceConfig, ServiceFeature, PricingTier } from './config';

// ==============================================
// API TYPES
// ==============================================
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ==============================================
// USER TYPES
// ==============================================
export type UserRole = 'admin' | 'client';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    createdAt: Date;
}

export interface UserSession {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

// ==============================================
// PROJECT TYPES
// ==============================================
export type ProjectType = 'sekolah' | 'berita' | 'company';
export type ProjectStatus = 'pending_payment' | 'in_progress' | 'review' | 'completed';

export interface ProjectCredentials {
    admin_url?: string;
    username?: string;
    password?: string;
}

export interface Project {
    id: string;
    userId: string;
    name: string;
    type: ProjectType;
    status: ProjectStatus;
    url?: string;
    credentials?: ProjectCredentials;
    createdAt: Date;
    updatedAt: Date;
}

// ==============================================
// INVOICE TYPES
// ==============================================
export type InvoiceStatus = 'unpaid' | 'paid';

export interface Invoice {
    id: string;
    projectId: string;
    amount: number;
    status: InvoiceStatus;
    midtransOrderId?: string;
    qrisUrl?: string;
    paidAt?: Date;
    createdAt: Date;
}

// ==============================================
// FORM TYPES
// ==============================================
export interface LoginForm {
    email: string;
    password: string;
}

export interface RegisterForm {
    name: string;
    email: string;
    phone?: string;
    password: string;
}

// ==============================================
// PAYMENT TYPES
// ==============================================
export interface PaymentResponse {
    success: boolean;
    orderId: string;
    qrisUrl: string;
    grossAmount: number;
    paymentType: string;
    statusCode: string;
    transactionId?: string;
    message: string;
}

export interface CreateInvoiceRequest {
    projectId: string;
    amount: number;
}

export interface MidtransChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    actions?: Array<{
        name: string;
        method: string;
        url: string;
    }>;
}

// ==============================================
// COMPONENT PROPS
// ==============================================
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface NavLinkProps {
    href: string;
    label: string;
    isActive?: boolean;
}
