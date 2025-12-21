import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
import React from 'react';

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should instantiate without error', () => {
    expect(ErrorBoundary).toBeDefined();
  });

  it('should have correct constructor signature', () => {
    // Test that ErrorBoundary is a React class component
    expect(typeof ErrorBoundary).toBe('function');
    expect(ErrorBoundary.prototype.render).toBeDefined();
  });

  it('should have static getDerivedStateFromError method', () => {
    const error = new Error('Test error');
    const result = ErrorBoundary.getDerivedStateFromError(error);
    
    expect(result).toEqual({
      hasError: true,
      error: error
    });
  });

  it('should handle null error in getDerivedStateFromError', () => {
    const result = ErrorBoundary.getDerivedStateFromError(null as any);
    
    expect(result).toEqual({
      hasError: true,
      error: null
    });
  });

  it('should reset to initial state', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    
    expect(errorBoundary.state).toEqual({
      hasError: false,
      error: null
    });
  });

  it('should update state on error', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    const testError = new Error('Test error');
    
    const newState = ErrorBoundary.getDerivedStateFromError(testError);
    
    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(testError);
  });

  it('should have componentDidCatch method', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    expect(typeof errorBoundary.componentDidCatch).toBe('function');
  });

  it('should log error in componentDidCatch', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    const error = new Error('Test error');
    const errorInfo = { componentStack: 'Test stack' };
    
    errorBoundary.componentDidCatch(error, errorInfo);
    
    expect(console.error).toHaveBeenCalledWith('Uncaught error:', error, errorInfo);
  });

  it('should accept className prop', () => {
    const errorBoundary = new ErrorBoundary({ children: null, className: 'test-class' });
    expect(errorBoundary.props.className).toBe('test-class');
  });

  it('should accept fallback prop', () => {
    const fallback = React.createElement('div', null, 'Custom fallback');
    const errorBoundary = new ErrorBoundary({ children: null, fallback });
    expect(errorBoundary.props.fallback).toBe(fallback);
  });
});

describe('ErrorBoundary State Management', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should maintain correct error state', () => {
    // Initial state verification
    const initialErrorBoundary = new ErrorBoundary({ children: null });
    expect(initialErrorBoundary.state.hasError).toBe(false);
    expect(initialErrorBoundary.state.error).toBe(null);
    
    // Check that getDerivedStateFromError works correctly
    const testError = new Error('Test error');
    const expectedState = {
      hasError: true,
      error: testError
    };
    
    const newState = ErrorBoundary.getDerivedStateFromError(testError);
    expect(newState).toEqual(expectedState);
    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(testError);
  });

  it('should handle different error types', () => {
    const stringError = 'String error';
    const objectError = { message: 'Object error' };
    const customError = new TypeError('Type error');
    
    expect(ErrorBoundary.getDerivedStateFromError(stringError as any)).toEqual({
      hasError: true,
      error: stringError
    });
    
    expect(ErrorBoundary.getDerivedStateFromError(objectError as any)).toEqual({
      hasError: true,
      error: objectError
    });
    
    expect(ErrorBoundary.getDerivedStateFromError(customError)).toEqual({
      hasError: true,
      error: customError
    });
  });
});

describe('ErrorBoundary Props Interface', () => {
  it('should accept children prop', () => {
    const children = React.createElement('div', null, 'Test content');
    const errorBoundary = new ErrorBoundary({ children });
    expect(errorBoundary.props.children).toBe(children);
  });

  it('should handle optional props gracefully', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    
    expect(errorBoundary.props.fallback).toBeUndefined();
    expect(errorBoundary.props.className).toBeUndefined();
  });

  it('should work with all props defined', () => {
    const children = React.createElement('div', null, 'Test');
    const fallback = React.createElement('div', null, 'Fallback');
    
    const errorBoundary = new ErrorBoundary({
      children,
      fallback,
      className: 'custom-class'
    });
    
    expect(errorBoundary.props.children).toBe(children);
    expect(errorBoundary.props.fallback).toBe(fallback);
    expect(errorBoundary.props.className).toBe('custom-class');
  });
});

describe('ErrorBoundary Edge Cases', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should handle undefined error in componentDidCatch gracefully', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    const errorInfo = { componentStack: 'Test stack' };
    
    // Should not throw error
    expect(() => {
      errorBoundary.componentDidCatch(undefined as any, errorInfo);
    }).not.toThrow();
    
    expect(console.error).toHaveBeenCalledWith('Uncaught error:', undefined, errorInfo);
  });

  it('should handle null error in componentDidCatch gracefully', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    const errorInfo = { componentStack: 'Test stack' };
    
    // Should not throw error
    expect(() => {
      errorBoundary.componentDidCatch(null as any, errorInfo);
    }).not.toThrow();
    
    expect(console.error).toHaveBeenCalledWith('Uncaught error:', null, errorInfo);
  });

  it('should handle errorInfo with missing properties', () => {
    const errorBoundary = new ErrorBoundary({ children: null });
    const error = new Error('Test error');
    const incompleteErrorInfo = {} as any;
    
    // Should not throw error
    expect(() => {
      errorBoundary.componentDidCatch(error, incompleteErrorInfo);
    }).not.toThrow();
    
    expect(console.error).toHaveBeenCalledWith('Uncaught error:', error, incompleteErrorInfo);
  });
});

describe('ErrorBoundary Error Handling Scenarios', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should handle various error message formats', () => {
    const errors = [
      new Error('Simple error'),
      new Error('Error with special chars: !@#$%^&*()'),
      new Error(''),
      new Error('Error with multiple\nlines\tand\ttabs')
    ];
    
    errors.forEach(error => {
      const result = ErrorBoundary.getDerivedStateFromError(error);
      expect(result.hasError).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  it('should handle TypeError specifically', () => {
    const typeError = new TypeError('Cannot read property of undefined');
    const result = ErrorBoundary.getDerivedStateFromError(typeError);
    
    expect(result.hasError).toBe(true);
    expect(result.error).toBe(typeError);
    expect(result.error?.name).toBe('TypeError');
  });

  it('should handle ReferenceError specifically', () => {
    const refError = new ReferenceError('x is not defined');
    const result = ErrorBoundary.getDerivedStateFromError(refError);
    
    expect(result.hasError).toBe(true);
    expect(result.error).toBe(refError);
    expect(result.error?.name).toBe('ReferenceError');
  });

  it('should handle custom errors', () => {
    class CustomError extends Error {
      constructor(message: string, public code: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    
    const customError = new CustomError('Custom message', 'E123');
    const result = ErrorBoundary.getDerivedStateFromError(customError);
    
    expect(result.hasError).toBe(true);
    expect(result.error).toBe(customError);
    expect((result.error as CustomError).code).toBe('E123');
  });
});