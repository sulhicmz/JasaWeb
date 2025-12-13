import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import React from 'react';
import { designTokens } from '../design-tokens';

export interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variantClasses = {
      primary: `bg-gradient-to-r from-[${designTokens.getColor('primary', '600')}] to-[${designTokens.getColor('primary', '700')}] text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 border border-white/10`,
      secondary: `bg-[${designTokens.getColor('neutral', '800')}] text-white hover:bg-[${designTokens.getColor('neutral', '700')}] border border-white/10 hover:border-white/20`,
      outline: `border border-[${designTokens.getColor('primary', '500')}] text-[${designTokens.getColor('primary', '400')}] hover:bg-[${designTokens.getColor('primary', '500')}] hover:border-[${designTokens.getColor('primary', '400')}] hover:text-[${designTokens.getColor('primary', '300')}]`,
      ghost: `text-[${designTokens.getColor('neutral', '400')}] hover:text-white hover:bg-white/5`,
    };

    const sizeClasses = {
      sm: `h-8 px-3 text-[${designTokens.getFontSize('sm')}]`,
      md: `h-10 px-4 py-2 text-[${designTokens.getFontSize('base')}]`,
      lg: `h-12 px-8 text-[${designTokens.getFontSize('lg')}]`,
    };

    const disabled = props.disabled || loading;

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={disabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
