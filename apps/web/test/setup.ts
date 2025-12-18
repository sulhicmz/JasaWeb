// Vitest setup file for web app test environment
import { vi } from 'vitest';

// Ensure vitest globals are available
global.describe = global.describe || describe;
global.it = global.it || it;
global.test = global.test || test;
global.expect = global.expect || expect;
global.beforeAll = global.beforeAll || beforeAll;
global.afterAll = global.afterAll || afterAll;
global.beforeEach = global.beforeEach || beforeEach;
global.afterEach = global.afterEach || afterEach;

// Mock browser APIs
Object.defineProperty(window, 'fetch', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock document.createElement for link elements
const mockLink = {
  href: '',
  rel: '',
  type: '',
  onload: null,
  onerror: null,
};

global.document = global.document || {};
global.document.createElement = vi.fn(() => mockLink);
global.document.body = global.document.body || {};
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

// Export empty to make this a module
export {};
