/**
 * Admin CRUD Utilities
 * Reusable patterns for admin operations across different entities
 * Promotes consistency and reduces code duplication
 */

import type { PrismaClient } from '@prisma/client';
import { errorResponse } from '@/lib/api';

// ==============================================
// CRUD INTERFACES
// ==============================================

export interface ListOptions {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}

export interface PaginationResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CrudService<T, CreateData, UpdateData> {
    list(options?: ListOptions): Promise<PaginationResult<T>>;
    findById(id: string): Promise<T | null>;
    create(data: CreateData): Promise<T>;
    update(id: string, data: UpdateData): Promise<T>;
    delete(id: string): Promise<void>;
}

// ==============================================
// GENERIC CRUD OPERATIONS
// ==============================================

export class BaseCrudService<T, CreateData, UpdateData> {
    constructor(
        protected prisma: PrismaClient,
        protected modelName: keyof PrismaClient,
        protected defaultSelect: any
    ) {}

    protected buildWhereClause(options: ListOptions): any {
        const where: any = {};

        // Add search functionality (search in common fields)
        if (options.search) {
            where.OR = this.buildSearchFields(options.search);
        }

        // Add custom filters
        if (options.filters) {
            Object.assign(where, options.filters);
        }

        return where;
    }

    protected buildSearchFields(_search: string): any[] {
        // Override in implementing classes for specific search fields
        return [];
    }

    protected getDefaultListOptions(): Required<Omit<ListOptions, 'filters' | 'search'>> {
        return {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
    }

    async list(options: ListOptions = {}): Promise<PaginationResult<T>> {
        const defaults = this.getDefaultListOptions();
        const opts = { ...defaults, ...options };
        const { page = 1, limit = 10, sortBy, sortOrder } = opts;
        const skip = (page - 1) * limit;

        const where = this.buildWhereClause(opts);

        // Type-safe dynamic access to Prisma model
        const model = this.prisma[this.modelName] as any;

        // Get items and total count in parallel
        const [items, total] = await Promise.all([
            model.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy!]: sortOrder },
                select: this.defaultSelect
            }),
            model.count({ where })
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findById(id: string): Promise<T | null> {
        const model = this.prisma[this.modelName] as any;
        return model.findUnique({
            where: { id },
            select: this.defaultSelect
        });
    }

    async create(data: CreateData): Promise<T> {
        const model = this.prisma[this.modelName] as any;
        return model.create({
            data,
            select: this.defaultSelect
        });
    }

    async update(id: string, data: UpdateData): Promise<T> {
        const model = this.prisma[this.modelName] as any;
        return model.update({
            where: { id },
            data,
            select: this.defaultSelect
        });
    }

    async delete(id: string): Promise<void> {
        const model = this.prisma[this.modelName] as any;
        await model.delete({
            where: { id }
        });
    }
}

// ==============================================
// VALIDATION UTILITIES
// ==============================================

export function validateRequiredFields<T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[]
): string | null {
    for (const field of requiredFields) {
        if (!data[field]) {
            return `${String(field)} wajib diisi`;
        }
    }
    return null;
}

export function validateId(id: string | undefined): string | null {
    if (!id) {
        return 'ID diperlukan';
    }
    
    if (typeof id !== 'string' || id.trim().length === 0) {
        return 'ID tidak valid';
    }
    
    return null;
}

// ==============================================
// ERROR HANDLING UTILITIES
// ==============================================

export function handleValidationError(message: string, status = 400): Response {
    return errorResponse(message, status);
}

export function handleNotFoundError(entity: string = 'Data'): Response {
    return errorResponse(`${entity} tidak ditemukan`, 404);
}

export function handleDuplicateError(field: string): Response {
    return errorResponse(`${field} sudah digunakan`, 409);
}

// ==============================================
// RESPONSE FORMATTERS
// ==============================================

export function formatListResponse<T>(
    result: PaginationResult<T>,
    entityName: string
) {
    return {
        [entityName]: result.items,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
        }
    };
}

export function formatCreateResponse<T>(item: T, entityName: string) {
    return {
        message: `${entityName} berhasil dibuat`,
        [entityName.toLowerCase()]: item
    };
}

export function formatUpdateResponse<T>(item: T, entityName: string) {
    return {
        message: `${entityName} berhasil diupdate`,
        [entityName.toLowerCase()]: item
    };
}

export function formatDeleteResponse(entityName: string) {
    return {
        message: `${entityName} berhasil dihapus`
    };
}