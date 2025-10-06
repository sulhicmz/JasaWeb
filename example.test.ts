// Example unit test file
import { describe, it, expect } from 'vitest';

// Example function to test
function add(a: number, b: number): number {
  return a + b;
}

describe('Example Unit Tests', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
    expect(add(Number.MIN_SAFE_INTEGER, 0)).toBe(Number.MIN_SAFE_INTEGER);
  });
});