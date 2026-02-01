import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show loading spinner when loading prop is true', () => {
    render(<Button loading>Submit</Button>);
    
    expect(screen.getByRole('button')).toContainHTML('animate-spin');
    expect(screen.getByRole('button')).toHaveAttribute('disabled');
  });

  it('should apply correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-600');
  });

  it('should apply correct size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3');
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('disabled');
  });

  it('should support custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should have hover and focus states for better UX', () => {
    render(<Button>Interactive</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('group');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('should prevent default form submission when type is button', () => {
    const handleSubmit = vi.fn();
    render(
      <form onSubmit={handleSubmit}>
        <Button type="button">Submit</Button>
      </form>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should submit form when type is submit', () => {
    const handleSubmit = vi.fn();
    render(
      <form onSubmit={handleSubmit}>
        <Button type="submit">Submit</Button>
      </form>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});