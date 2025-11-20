import { describe, it, expect } from '@jest/globals';

describe('Web App Basic Tests', () => {
  it('should perform basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello world');
    expect(result).toBe('hello world');
  });

  it('should have DOM environment available', () => {
    expect(document.createElement).toBeDefined();
    const div = document.createElement('div');
    expect(div.tagName).toBe('DIV');
  });
});
