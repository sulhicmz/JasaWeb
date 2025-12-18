"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const env_validation_1 = require("./env-validation");
(0, vitest_1.describe)('Basic Functionality Test', () => {
    (0, vitest_1.it)('should generate secure secrets with specified length', () => {
        const secret = (0, env_validation_1.generateSecureSecret)(16);
        (0, vitest_1.expect)(secret).toHaveLength(16);
        (0, vitest_1.expect)(typeof secret).toBe('string');
        (0, vitest_1.expect)(/^[A-Za-z0-9+/=_-]+$/.test(secret)).toBe(true);
    });
    (0, vitest_1.it)('should generate different secrets each time', () => {
        const secret1 = (0, env_validation_1.generateSecureSecret)(16);
        const secret2 = (0, env_validation_1.generateSecureSecret)(16);
        (0, vitest_1.expect)(secret1).not.toBe(secret2);
    });
    (0, vitest_1.it)('should generate secrets of different lengths', () => {
        const secret8 = (0, env_validation_1.generateSecureSecret)(8);
        const secret32 = (0, env_validation_1.generateSecureSecret)(32);
        (0, vitest_1.expect)(secret8).toHaveLength(8);
        (0, vitest_1.expect)(secret32).toHaveLength(32);
    });
});
//# sourceMappingURL=basic.test.js.map