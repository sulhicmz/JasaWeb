import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Button } from './components/Button';

describe('UI Components', () => {
  it('should render Button component', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle basic math operations', () => {
    expect(2 + 2).toBe(4);
  });
});
