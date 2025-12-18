"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredEnv = getRequiredEnv;
exports.getOptionalEnv = getOptionalEnv;
exports.getEnvNumber = getEnvNumber;
exports.getEnvBoolean = getEnvBoolean;
exports.generateSecureSecret = generateSecureSecret;
function getRequiredEnv(key) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        throw new Error(`Required environment variable ${key} is missing or empty`);
    }
    return value;
}
function getOptionalEnv(key, defaultValue) {
    const value = process.env[key];
    return value !== undefined && value !== '' ? value : defaultValue;
}
function getEnvNumber(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    const parsed = Number(value);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
    }
    return parsed;
}
function getEnvBoolean(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    return value.toLowerCase() === 'true';
}
function generateSecureSecret(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const values = new Uint32Array(length);
        crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            if (values[i] !== undefined) {
                result += charset[values[i] % charset.length];
            }
        }
    }
    else {
        for (let i = 0; i < length; i++) {
            result += charset[Math.floor(Math.random() * charset.length)];
        }
    }
    return result;
}
//# sourceMappingURL=env-validation.js.map