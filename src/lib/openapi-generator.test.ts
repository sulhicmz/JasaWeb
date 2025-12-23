/**
 * OpenAPI Generator Test Suite
 * validates API specification generation and structure
 */

import { describe, it, expect } from 'vitest';
import { generateOpenApiJson, validateOpenApiSpec, getEndpointCount, getSchemaCount, openApiSpec } from '@/lib/openapi-generator';

describe('OpenAPI Generator', () => {
    describe('Specification Structure', () => {
        it('should generate valid OpenAPI 3.0 specification', () => {
            const spec = openApiSpec;
            
            expect(spec.openapi).toBe('3.0.0');
            expect(spec.info).toBeDefined();
            expect(spec.paths).toBeDefined();
            expect(spec.components).toBeDefined();
        });

        it('should have complete info object', () => {
            const { info } = openApiSpec;
            
            expect(info.title).toBe('JasaWeb API');
            expect(info.version).toBe('1.0.0');
            expect(info.description).toContain('JasaWeb Platform API Documentation');
            expect(info.contact).toBeDefined();
            expect(info.license).toBeDefined();
        });

        it('should have server configurations', () => {
            const servers = openApiSpec.servers;
            
            expect(servers).toHaveLength(2);
            expect(servers?.[0]).toEqual({
                url: 'https://jasaweb.com',
                description: 'Production server'
            });
            expect(servers?.[1]).toEqual({
                url: 'https://dev.jasaweb.com',
                description: 'Development server'
            });
        });

        it('should have component schemas and security schemes', () => {
            const components = openApiSpec.components;
            
            expect(components?.schemas).toBeDefined();
            expect(components?.securitySchemes).toBeDefined();
            expect(components?.securitySchemes?.bearerAuth).toBeDefined();
        });
    });

    describe('Schema Definitions', () => {
        it('should include all required schemas', () => {
            const schemas = openApiSpec.components?.schemas;
            const requiredSchemas = [
                'ApiResponse',
                'PaginatedResponse',
                'User',
                'Project',
                'Invoice',
                'LoginForm',
                'RegisterForm',
                'PaymentResponse',
                'ErrorResponse'
            ];

            requiredSchemas.forEach(schema => {
                expect(schemas?.[schema]).toBeDefined();
            });
        });

        it('should have valid User schema structure', () => {
            const userSchema = openApiSpec.components?.schemas?.User;
            
            if (userSchema && 'type' in userSchema) {
                expect(userSchema.type).toBe('object');
                expect(userSchema.properties).toBeDefined();
            }
        });

        it('should have valid Project schema structure', () => {
            const projectSchema = openApiSpec.components?.schemas?.Project;
            
            if (projectSchema && 'type' in projectSchema) {
                expect(projectSchema.type).toBe('object');
                expect(projectSchema.properties).toBeDefined();
            }
        });
    });

    describe('API Endpoints', () => {
        it('should include authentication endpoints', () => {
            const paths = openApiSpec.paths;
            
            expect(paths?.['/api/auth/login']).toBeDefined();
            expect(paths?.['/api/auth/login']?.post).toBeDefined();
            expect(paths?.['/api/auth/register']).toBeDefined();
            expect(paths?.['/api/auth/register']?.post).toBeDefined();
            expect(paths?.['/api/auth/logout']).toBeDefined();
            expect(paths?.['/api/auth/logout']?.post).toBeDefined();
        });

        it('should include client portal endpoints', () => {
            const paths = openApiSpec.paths;
            
            expect(paths?.['/api/client/projects']).toBeDefined();
            expect(paths?.['/api/client/projects']?.get).toBeDefined();
            expect(paths?.['/api/client/invoices']).toBeDefined();
            expect(paths?.['/api/client/invoices']?.get).toBeDefined();
            expect(paths?.['/api/client/payment']).toBeDefined();
            expect(paths?.['/api/client/payment']?.post).toBeDefined();
        });

        it('should include admin endpoints', () => {
            const paths = openApiSpec.paths;
            
            expect(paths?.['/api/admin/users']).toBeDefined();
            expect(paths?.['/api/admin/users']?.get).toBeDefined();
            expect(paths?.['/api/admin/users']?.post).toBeDefined();
            expect(paths?.['/api/admin/dashboard']).toBeDefined();
            expect(paths?.['/api/admin/dashboard']?.get).toBeDefined();
        });

        it('should include public endpoints', () => {
            const paths = openApiSpec.paths;
            
            expect(paths?.['/api/templates']).toBeDefined();
            expect(paths?.['/api/templates']?.get).toBeDefined();
            expect(paths?.['/api/posts']).toBeDefined();
            expect(paths?.['/api/posts']?.get).toBeDefined();
            expect(paths?.['/api/health']).toBeDefined();
            expect(paths?.['/api/health']?.get).toBeDefined();
        });

        it('should include webhook endpoints', () => {
            const paths = openApiSpec.paths;
            
            expect(paths?.['/api/webhooks/midtrans']).toBeDefined();
            expect(paths?.['/api/webhooks/midtrans']?.post).toBeDefined();
        });
    });

    describe('Endpoint Documentation', () => {
        it('should have proper authentication endpoint documentation', () => {
            const loginEndpoint = openApiSpec.paths?.['/api/auth/login']?.post;
            
            expect(loginEndpoint?.tags).toContain('Authentication');
            expect(loginEndpoint?.summary).toBe('User login');
            expect(loginEndpoint?.requestBody).toBeDefined();
            expect(loginEndpoint?.responses).toBeDefined();
        });

        it('should have proper client endpoints with security', () => {
            const projectsEndpoint = openApiSpec.paths?.['/api/client/projects']?.get;
            
            expect(projectsEndpoint?.tags).toContain('Client Portal');
            expect(projectsEndpoint?.security).toEqual([{ bearerAuth: [] }]);
            expect(projectsEndpoint?.responses?.['200']).toBeDefined();
        });

        it('should have proper admin endpoints with security', () => {
            const usersEndpoint = openApiSpec.paths?.['/api/admin/users']?.get;
            
            expect(usersEndpoint?.tags).toContain('Admin Panel');
            expect(usersEndpoint?.security).toEqual([{ bearerAuth: [] }]);
            expect(usersEndpoint?.responses?.['200']).toBeDefined();
        });
    });

    describe('Pagination Support', () => {
        it('should include pagination parameters in list endpoints', () => {
            const projectsEndpoint = openApiSpec.paths?.['/api/client/projects']?.get;
            const usersEndpoint = openApiSpec.paths?.['/api/admin/users']?.get;
            
            // Check pagination parameters exist
            const hasPageParam = projectsEndpoint?.parameters?.some((p: any) => p.name === 'page') ?? false;
            const hasLimitParam = projectsEndpoint?.parameters?.some((p: any) => p.name === 'limit') ?? false;
            const hasPageParam2 = usersEndpoint?.parameters?.some((p: any) => p.name === 'page') ?? false;
            const hasLimitParam2 = usersEndpoint?.parameters?.some((p: any) => p.name === 'limit') ?? false;
            
            expect(hasPageParam).toBe(true);
            expect(hasLimitParam).toBe(true);
            expect(hasPageParam2).toBe(true);
            expect(hasLimitParam2).toBe(true);
        });

        it('should include pagination response structure', () => {
            const paginationSchema = openApiSpec.components?.schemas?.PaginatedResponse;
            
            if (paginationSchema && 'type' in paginationSchema) {
                expect(paginationSchema.type).toBe('object');
                expect(paginationSchema.properties).toBeDefined();
            }
        });
    });

    describe('Error Handling Documentation', () => {
        it('should document error responses consistently', () => {
            const endpoints = [
                openApiSpec.paths?.['/api/auth/login']?.post,
                openApiSpec.paths?.['/api/client/projects']?.get,
                openApiSpec.paths?.['/api/admin/users']?.get
            ];

            endpoints.forEach(endpoint => {
                if (endpoint?.responses) {
                    const responseCodes = Object.keys(endpoint.responses);
                    const hasErrorResponses = responseCodes.some(code => 
                        ['400', '401', '403', '404', '429', '500'].includes(code)
                    );
                    expect(hasErrorResponses).toBe(true);
                }
            });
        });

        it('should have error response schema', () => {
            const errorSchema = openApiSpec.components?.schemas?.ErrorResponse;
            
            if (errorSchema && 'type' in errorSchema) {
                expect(errorSchema.type).toBe('object');
                expect(errorSchema.properties).toBeDefined();
            }
        });
    });

    describe('Security Documentation', () => {
        it('should document JWT security scheme', () => {
            const securitySchemes = openApiSpec.components?.securitySchemes;
            
            expect(securitySchemes?.bearerAuth).toBeDefined();
        });

        it('should apply security to protected endpoints', () => {
            const protectedEndpoints = [
                '/api/client/projects',
                '/api/client/invoices',
                '/api/admin/users',
                '/api/admin/dashboard'
            ];

            protectedEndpoints.forEach(path => {
                const endpoint = openApiSpec.paths?.[path]?.get || openApiSpec.paths?.[path]?.post;
                if (endpoint) {
                    expect(endpoint.security).toEqual([{ bearerAuth: [] }]);
                }
            });
        });

        it('should not require security for public endpoints', () => {
            const publicEndpoints = [
                '/api/auth/login',
                '/api/auth/register',
                '/api/templates',
                '/api/posts',
                '/api/health'
            ];

            publicEndpoints.forEach(path => {
                const endpoint = openApiSpec.paths?.[path]?.get || openApiSpec.paths?.[path]?.post;
                if (endpoint) {
                    expect(endpoint.security).toBeUndefined();
                }
            });
        });
    });

    describe('Utility Functions', () => {
        it('should generate valid JSON specification', () => {
            const jsonSpec = generateOpenApiJson();
            
            expect(() => JSON.parse(jsonSpec)).not.toThrow();
            
            const parsedSpec = JSON.parse(jsonSpec);
            expect(parsedSpec.openapi).toBe('3.0.0');
            expect(parsedSpec.info).toBeDefined();
        });

        it('should validate OpenAPI specification', () => {
            expect(validateOpenApiSpec()).toBe(true);
        });

        it('should count endpoints accurately', () => {
            const endpointCount = getEndpointCount();
            
            expect(endpointCount).toBeGreaterThan(10);
            expect(typeof endpointCount).toBe('number');
            
            // Log actual count for debugging
            console.log(`Actual endpoint count: ${endpointCount}`);
        });

        it('should count schemas accurately', () => {
            const schemaCount = getSchemaCount();
            
            expect(schemaCount).toBeGreaterThan(10);
            expect(typeof schemaCount).toBe('number');
        });
    });

    describe('Tags Organization', () => {
        it('should have proper tag definitions', () => {
            const tags = openApiSpec.tags;
            
            expect(tags).toHaveLength(5);
            
            const tagNames = tags?.map(tag => tag.name) || [];
            expect(tagNames).toContain('Authentication');
            expect(tagNames).toContain('Client Portal');
            expect(tagNames).toContain('Admin Panel');
            expect(tagNames).toContain('Public');
            expect(tagNames).toContain('Webhooks');
        });

        it('should organize endpoints under correct tags', () => {
            // Check that endpoints are properly tagged
            expect(openApiSpec.paths?.['/api/auth/login']?.post?.tags).toContain('Authentication');
            expect(openApiSpec.paths?.['/api/client/projects']?.get?.tags).toContain('Client Portal');
            expect(openApiSpec.paths?.['/api/admin/users']?.get?.tags).toContain('Admin Panel');
            expect(openApiSpec.paths?.['/api/templates']?.get?.tags).toContain('Public');
            expect(openApiSpec.paths?.['/api/webhooks/midtrans']?.post?.tags).toContain('Webhooks');
        });
    });

    describe('Response Examples', () => {
        it('should include examples in schemas', () => {
            const userSchema = openApiSpec.components?.schemas?.User;
            const loginFormSchema = openApiSpec.components?.schemas?.LoginForm;
            
            if (userSchema && 'properties' in userSchema) {
                expect((userSchema.properties as any)?.email?.example).toBe('user@example.com');
            }
            if (loginFormSchema && 'properties' in loginFormSchema) {
                expect((loginFormSchema.properties as any)?.email?.example).toBe('user@example.com');
            }
        });

        it('should have proper response status codes', () => {
            const loginEndpoint = openApiSpec.paths?.['/api/auth/login']?.post;
            const responses = loginEndpoint?.responses;
            
            expect(responses?.['200']).toBeDefined(); // Success
            expect(responses?.['401']).toBeDefined(); // Unauthorized
            expect(responses?.['429']).toBeDefined(); // Rate limited
        });
    });
});