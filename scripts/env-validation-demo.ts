#!/usr/bin/env node

/**
 * Environment Validation Demo
 * Demonstrates environment variable validation in different scenarios
 */

// Simulate environment validation
function simulateEnvironmentValidation(env: Record<string, string | undefined>) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY'];
    
    for (const varName of requiredVars) {
        if (!env[varName]) {
            errors.push(`Required environment variable '${varName}' is missing`);
        }
    }

    // Validate formats
    if (env.DATABASE_URL && !env.DATABASE_URL.startsWith('postgresql://')) {
        errors.push("Environment variable 'DATABASE_URL' has invalid value. Expected: Neon PostgreSQL connection string");
    }

    if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
        errors.push("Environment variable 'JWT_SECRET' has invalid value. Expected: JWT signing secret (min 32 characters)");
    }

    if (env.MIDTRANS_SERVER_KEY && !env.MIDTRANS_SERVER_KEY.startsWith('SB-Mid-server-') && !env.MIDTRANS_SERVER_KEY.startsWith('Mid-server-')) {
        errors.push("Environment variable 'MIDTRANS_SERVER_KEY' has invalid value. Expected: Midtrans server key for payment processing");
    }

    // Check for placeholder values
    if (env.MIDTRANS_SERVER_KEY && env.MIDTRANS_SERVER_KEY.includes('xxx')) {
        warnings.push("'MIDTRANS_SERVER_KEY' appears to be using placeholder value");
    }

    // Check production vs sandbox
    if (env.NODE_ENV === 'production' && env.MIDTRANS_SERVER_KEY?.startsWith('SB-Mid-server-')) {
        warnings.push('Using sandbox Midtrans key in production environment');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

console.log('=== Environment Validation Demo ===\n');

// Test Case 1: Missing variables
console.log('📋 Test Case 1: Missing Required Variables');
const result1 = simulateEnvironmentValidation({
    NODE_ENV: 'development',
    DATABASE_URL: '',
    JWT_SECRET: '',
    MIDTRANS_SERVER_KEY: '',
    MIDTRANS_CLIENT_KEY: '',
});
console.log('Valid:', result1.isValid);
console.log('Errors:', result1.errors);
console.log('Warnings:', result1.warnings);
console.log('');

// Test Case 2: Invalid formats
console.log('📋 Test Case 2: Invalid Formats');
const result2 = simulateEnvironmentValidation({
    NODE_ENV: 'development',
    DATABASE_URL: 'invalid-url',
    JWT_SECRET: 'short',
    MIDTRANS_SERVER_KEY: 'invalid-key',
    MIDTRANS_CLIENT_KEY: 'SB-Mid-client-valid',
});
console.log('Valid:', result2.isValid);
console.log('Errors:', result2.errors);
console.log('Warnings:', result2.warnings);
console.log('');

// Test Case 3: Valid configuration
console.log('📋 Test Case 3: Valid Configuration');
const result3 = simulateEnvironmentValidation({
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://user:password@hostname:5432/database?sslmode=require',
    JWT_SECRET: 'super-secret-key-that-is-at-least-32-charars-long',
    MIDTRANS_SERVER_KEY: 'SB-Mid-server-test-12345',
    MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test-67890',
});
console.log('Valid:', result3.isValid);
console.log('Errors:', result3.errors);
console.log('Warnings:', result3.warnings);
console.log('');

// Test Case 4: Production warnings
console.log('📋 Test Case 4: Production Warnings');
const result4 = simulateEnvironmentValidation({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://user:password@hostname:5432/database?sslmode=require',
    JWT_SECRET: 'super-secret-key-that-is-at-least-32-charars-long',
    MIDTRANS_SERVER_KEY: 'SB-Mid-server-test-12345', // Sandbox key in production
    MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test-67890',
});
console.log('Valid:', result4.isValid);
console.log('Errors:', result4.errors);
console.log('Warnings:', result4.warnings);
console.log('');

// Test Case 5: Placeholder values
console.log('📋 Test Case 5: Placeholder Values');
const result5 = simulateEnvironmentValidation({
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://user:password@hostname:5432/database?sslmode=require',
    JWT_SECRET: 'super-secret-key-that-is-at-least-32-charars-long',
    MIDTRANS_SERVER_KEY: 'SB-Mid-server-xxx', // Placeholder
    MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test-67890',
});
console.log('Valid:', result5.isValid);
console.log('Errors:', result5.errors);
console.log('Warnings:', result5.warnings);
console.log('');

console.log('=== Demo Complete ===');