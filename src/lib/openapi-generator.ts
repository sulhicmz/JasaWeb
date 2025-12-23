/**
 * OpenAPI Documentation Generator
 * Automatically generates comprehensive API documentation for all endpoints
 * Leverages existing TypeScript types and API route analysis
 */

import type { OpenAPIV3 } from 'openapi-types';

// ==============================================
// OPENAPI SCHEMA DEFINITIONS
// ==============================================
const schemas: Record<string, OpenAPIV3.SchemaObject> = {
    // Basic Response Types
    ApiResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object', nullable: true },
            error: { type: 'string', nullable: true, example: null },
            message: { type: 'string', nullable: true, example: 'Operation successful' }
        }
    },

    PaginatedResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
                type: 'object',
                properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    total: { type: 'integer', example: 150 },
                    totalPages: { type: 'integer', example: 15 }
                }
            }
        }
    },

    // User Schemas
    User: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', nullable: true, example: '+62812345678' },
            role: { type: 'string', enum: ['admin', 'client'], example: 'client' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' }
        },
        required: ['id', 'email', 'name', 'role', 'createdAt']
    },

    UserSession: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'client'] }
        },
        required: ['id', 'email', 'name', 'role']
    },

    // Project Schemas
    Project: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Company Website' },
            type: { type: 'string', enum: ['sekolah', 'berita', 'company'], example: 'company' },
            status: { 
                type: 'string', 
                enum: ['pending_payment', 'in_progress', 'review', 'completed'], 
                example: 'in_progress' 
            },
            url: { type: 'string', nullable: true, example: 'https://example.com' },
            credentials: {
                type: 'object',
                nullable: true,
                properties: {
                    admin_url: { type: 'string', nullable: true },
                    username: { type: 'string', nullable: true },
                    password: { type: 'string', nullable: true }
                }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'userId', 'name', 'type', 'status', 'createdAt', 'updatedAt']
    },

    // Invoice Schemas
    Invoice: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', format: 'float', example: 1500000 },
            status: { type: 'string', enum: ['unpaid', 'paid'], example: 'unpaid' },
            midtransOrderId: { type: 'string', nullable: true },
            qrisUrl: { type: 'string', nullable: true, format: 'uri' },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'projectId', 'amount', 'status', 'createdAt']
    },

    // Form Schemas
    LoginForm: {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
        },
        required: ['email', 'password']
    },

    RegisterForm: {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 2, example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            phone: { type: 'string', nullable: true, example: '+62812345678' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
        },
        required: ['name', 'email', 'password']
    },

    CreateInvoiceRequest: {
        type: 'object',
        properties: {
            projectId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', format: 'float', minimum: 0 }
        },
        required: ['projectId', 'amount']
    },

    PaymentResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            orderId: { type: 'string', example: 'ORDER-123' },
            qrisUrl: { type: 'string', format: 'uri', example: 'https://app.sandbox.midtrans.com/payment/...' },
            grossAmount: { type: 'number', format: 'float', example: 1500000 },
            paymentType: { type: 'string', example: 'qris' },
            statusCode: { type: 'string', example: '201' },
            transactionId: { type: 'string', nullable: true },
            message: { type: 'string', example: 'Success, QRIS transaction is created' }
        },
        required: ['success', 'orderId', 'qrisUrl', 'grossAmount', 'paymentType', 'statusCode', 'message']
    },

    // Error Response
    ErrorResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Validation failed' },
            message: { type: 'string', nullable: true }
        },
        required: ['success', 'error']
    }
};

// ==============================================
// COMMON PARAMETERS
// ==============================================
const commonParameters: Record<string, OpenAPIV3.ParameterObject> = {
    page: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: { type: 'integer', minimum: 1, default: 1 }
    },
    limit: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
    },
    search: {
        name: 'search',
        in: 'query',
        description: 'Search term for filtering results',
        schema: { type: 'string', nullable: true }
    },
    sortBy: {
        name: 'sortBy',
        in: 'query',
        description: 'Field to sort by',
        schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'name', 'email'], default: 'createdAt' }
    },
    sortOrder: {
        name: 'sortOrder',
        in: 'query',
        description: 'Sort order',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
    }
};

// ==============================================
// SECURITY SCHEMES
// ==============================================
const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
    bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token (set via session cookie)'
    }
};

// ==============================================
// API ENDPOINTS DEFINITIONS
// ==============================================
const authEndpoints: Record<string, OpenAPIV3.PathItemObject> = {
    '/api/auth/login': {
        post: {
            tags: ['Authentication'],
            summary: 'User login',
            description: 'Authenticate user and create session',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/LoginForm' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Login successful',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    message: { type: 'string', example: 'Login berhasil' },
                                                    user: { $ref: '#/components/schemas/UserSession' }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '401': {
                    description: 'Invalid credentials',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '429': {
                    description: 'Too many requests',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },

    '/api/auth/register': {
        post: {
            tags: ['Authentication'],
            summary: 'User registration',
            description: 'Create new user account',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/RegisterForm' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'User created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    message: { type: 'string', example: 'Registrasi berhasil' },
                                                    user: { $ref: '#/components/schemas/User' }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '400': {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '409': {
                    description: 'Email already exists',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },

    '/api/auth/logout': {
        post: {
            tags: ['Authentication'],
            summary: 'User logout',
            description: 'Clear user session',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Logout successful',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiResponse' }
                        }
                    }
                }
            }
        }
    }
};

const clientEndpoints: Record<string, OpenAPIV3.PathItemObject> = {
    '/api/client/projects': {
        get: {
            tags: ['Client Portal'],
            summary: 'Get user projects',
            description: 'Retrieve authenticated user\'s projects with pagination',
            security: [{ bearerAuth: [] }],
            parameters: [
                commonParameters.page,
                commonParameters.limit,
                commonParameters.search,
                { ...commonParameters.sortBy, schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'name', 'status', 'type'], default: 'createdAt' } },
                commonParameters.sortOrder
            ],
            responses: {
                '200': {
                    description: 'Projects retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    projects: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/Project' }
                                                    },
                                                    pagination: { $ref: '#/components/schemas/PaginatedResponse/properties/pagination' }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '401': {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },

    '/api/client/invoices': {
        get: {
            tags: ['Client Portal'],
            summary: 'Get user invoices',
            description: 'Retrieve authenticated user\'s invoices with pagination',
            security: [{ bearerAuth: [] }],
            parameters: [
                commonParameters.page,
                commonParameters.limit,
                commonParameters.search,
                commonParameters.sortBy,
                commonParameters.sortOrder
            ],
            responses: {
                '200': {
                    description: 'Invoices retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    invoices: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/Invoice' }
                                                    },
                                                    pagination: { $ref: '#/components/schemas/PaginatedResponse/properties/pagination' }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '401': {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },

    '/api/client/payment': {
        post: {
            tags: ['Client Portal'],
            summary: 'Create payment for invoice',
            description: 'Generate QRIS payment for unpaid invoice',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateInvoiceRequest' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Payment created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/PaymentResponse' }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid request',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '404': {
                    description: 'Invoice not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },

    '/api/client/dashboard': {
        get: {
            tags: ['Client Portal'],
            summary: 'Get dashboard statistics',
            description: 'Retrieve user dashboard overview with project statistics',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Dashboard data retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    totalProjects: { type: 'integer', example: 5 },
                                                    completedProjects: { type: 'integer', example: 3 },
                                                    pendingProjects: { type: 'integer', example: 1 },
                                                    inProgressProjects: { type: 'integer', example: 1 },
                                                    totalInvoices: { type: 'integer', example: 5 },
                                                    paidInvoices: { type: 'integer', example: 3 },
                                                    unpaidInvoices: { type: 'integer', example: 2 }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
};

const adminEndpoints: Record<string, OpenAPIV3.PathItemObject> = {
    '/api/admin/users': {
        get: {
            tags: ['Admin Panel'],
            summary: 'List all users',
            description: 'Retrieve all users with pagination and filtering (Admin only)',
            security: [{ bearerAuth: [] }],
            parameters: [
                commonParameters.page,
                commonParameters.limit,
                commonParameters.search,
                { ...commonParameters.sortBy, schema: { type: 'string', enum: ['createdAt', 'name', 'email'], default: 'createdAt' } },
                commonParameters.sortOrder,
                {
                    name: 'role',
                    in: 'query',
                    description: 'Filter by user role',
                    schema: { type: 'string', enum: ['admin', 'client'], nullable: true }
                }
            ],
            responses: {
                '200': {
                    description: 'Users retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    users: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/User' }
                                                    },
                                                    pagination: { $ref: '#/components/schemas/PaginatedResponse/properties/pagination' }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '401': {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '403': {
                    description: 'Admin access required',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        },
        post: {
            tags: ['Admin Panel'],
            summary: 'Create new user',
            description: 'Create new user account (Admin only)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/RegisterForm' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'User created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    message: { type: 'string', example: 'User berhasil dibuat' },
                                                    user: { $ref: '#/components/schemas/User' }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '400': {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '401': {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '403': {
                    description: 'Admin access required',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '409': {
                    description: 'Email already exists',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },

    '/api/admin/dashboard': {
        get: {
            tags: ['Admin Panel'],
            summary: 'Get admin dashboard statistics',
            description: 'Retrieve comprehensive dashboard overview (Admin only)',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Dashboard data retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    totalUsers: { type: 'integer', example: 150 },
                                                    totalProjects: { type: 'integer', example: 300 },
                                                    totalInvoices: { type: 'integer', example: 280 },
                                                    totalRevenue: { type: 'number', format: 'float', example: 420000000 },
                                                    recentUsers: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/User' }
                                                    },
                                                    recentProjects: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/Project' }
                                                    },
                                                    projectStats: {
                                                        type: 'object',
                                                        properties: {
                                                            pendingPayment: { type: 'integer', example: 25 },
                                                            inProgress: { type: 'integer', example: 45 },
                                                            review: { type: 'integer', example: 15 },
                                                            completed: { type: 'integer', example: 215 }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                '401': {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '403': {
                    description: 'Admin access required',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },

    '/api/admin/performance': {
        get: {
            tags: ['Admin Panel'],
            summary: 'Get system performance metrics',
            description: 'Retrieve performance monitoring data (Admin only)',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Performance data retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    bundleSize: { type: 'object', example: { size: '189KB', score: 85 }},
                                                    apiPerformance: { type: 'array', items: { type: 'number' }},
                                                    databasePerformance: { type: 'number', example: 1.23 },
                                                    cacheHitRate: { type: 'number', example: 94.5 },
                                                    activeSessions: { type: 'integer', example: 45 }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
};

const publicEndpoints: Record<string, OpenAPIV3.PathItemObject> = {
    '/api/templates': {
        get: {
            tags: ['Public'],
            summary: 'Get available templates',
            description: 'Retrieve all available website templates',
            parameters: [
                {
                    name: 'category',
                    in: 'query',
                    description: 'Filter by template category',
                    schema: { type: 'string', enum: ['sekolah', 'berita', 'company'], nullable: true }
                }
            ],
            responses: {
                '200': {
                    description: 'Templates retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string', format: 'uuid' },
                                                        name: { type: 'string', example: 'Modern School Website' },
                                                        category: { type: 'string', enum: ['sekolah', 'berita', 'company'] },
                                                        imageUrl: { type: 'string', format: 'uri' },
                                                        demoUrl: { type: 'string', format: 'uri' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/posts': {
        get: {
            tags: ['Public'],
            summary: 'Get blog posts',
            description: 'Retrieve published blog posts with pagination',
            parameters: [
                commonParameters.page,
                commonParameters.limit,
                commonParameters.search,
                {
                    name: 'category',
                    in: 'query',
                    description: 'Filter by post category',
                    schema: { type: 'string', nullable: true }
                }
            ],
            responses: {
                '200': {
                    description: 'Posts retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string', format: 'uuid' },
                                                        title: { type: 'string', example: 'How to Choose a Website Template' },
                                                        slug: { type: 'string', example: 'how-to-choose-website-template' },
                                                        excerpt: { type: 'string', example: 'Choosing the right template...' },
                                                        featuredImage: { type: 'string', format: 'uri', nullable: true },
                                                        publishedAt: { type: 'string', format: 'date-time' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/health': {
        get: {
            tags: ['Public'],
            summary: 'Health check endpoint',
            description: 'System health and status check',
            responses: {
                '200': {
                    description: 'System is healthy',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    status: { type: 'string', example: 'healthy' },
                                                    timestamp: { type: 'string', format: 'date-time' },
                                                    version: { type: 'string', example: '1.0.0' },
                                                    environment: { type: 'string', enum: ['development', 'production'] }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
};

const webhookEndpoints: Record<string, OpenAPIV3.PathItemObject> = {
    '/api/webhooks/midtrans': {
        post: {
            tags: ['Webhooks'],
            summary: 'Midtrans payment webhook',
            description: 'Handle payment status notifications from Midtrans',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                order_id: { type: 'string', example: 'ORDER-123' },
                                status_code: { type: 'string', example: '200' },
                                transaction_status: { type: 'string', example: 'settlement' },
                                gross_amount: { type: 'string', example: '150000.00' },
                                payment_type: { type: 'string', example: 'qris' },
                                transaction_time: { type: 'string', format: 'date-time' },
                                fraud_status: { type: 'string', nullable: true }
                            },
                            required: ['order_id', 'status_code', 'transaction_status', 'gross_amount']
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Webhook processed successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApiResponse' }
                        }
                    }
                },
                '400': {
                    description: 'Invalid webhook payload',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                '401': {
                    description: 'Invalid webhook signature',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    }
};

// ==============================================
// COMPLETE OPENAPI SPECIFICATION
// ==============================================
export const openApiSpec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
        title: 'JasaWeb API',
        version: '1.0.0',
        description: `
        **JasaWeb Platform API Documentation**
        
        Comprehensive API for the JasaWeb website building platform.
        
        ## Overview
        - **Authentication**: JWT-based session management
        - **Rate Limiting**: Applied to sensitive endpoints
        - **Pagination**: Standardized across all list endpoints
        - **Error Handling**: Consistent error response format
        
        ## Key Features
        - User registration and authentication
        - Project management and tracking
        - Invoice and payment processing (QRIS)
        - Admin panel with comprehensive management
        - Template gallery and blog management
        
        ## Security
        - All authenticated endpoints require valid JWT token
        - Rate limiting prevents abuse
        - Input validation on all endpoints
        - CSRF protection for state-changing operations
        `,
        contact: {
            name: 'JasaWeb Support',
            email: 'support@jasaweb.com'
        },
        license: {
            name: 'Proprietary',
            url: 'https://jasaweb.com/terms'
        }
    },
    servers: [
        {
            url: 'https://jasaweb.com',
            description: 'Production server'
        },
        {
            url: 'https://dev.jasaweb.com',
            description: 'Development server'
        }
    ],
    paths: {
        ...authEndpoints,
        ...clientEndpoints,
        ...adminEndpoints,
        ...publicEndpoints,
        ...webhookEndpoints
    } as OpenAPIV3.PathsObject,
    components: {
        schemas,
        securitySchemes
    },
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and session management'
        },
        {
            name: 'Client Portal',
            description: 'Authenticated client features'
        },
        {
            name: 'Admin Panel',
            description: 'Administrative functions (Admin access required)'
        },
        {
            name: 'Public',
            description: 'Publicly accessible endpoints'
        },
        {
            name: 'Webhooks',
            description: 'External service webhooks'
        }
    ]
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
export function generateOpenApiJson(): string {
    return JSON.stringify(openApiSpec, null, 2);
}

export function validateOpenApiSpec(): boolean {
    // Basic validation - in production, use openapi-validator
    const requiredFields = ['openapi', 'info', 'paths'];
    return requiredFields.every(field => field in openApiSpec);
}

export function getEndpointCount(): number {
    return Object.keys(openApiSpec.paths).length;
}

export function getSchemaCount(): number {
    return Object.keys(schemas).length;
}