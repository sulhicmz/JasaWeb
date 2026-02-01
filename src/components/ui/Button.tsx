import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    className?: string;
    loading?: boolean;
}

export function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    className = '',
    loading = false
}: ButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden group';
    
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md transform hover:-translate-y-0.5',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
    };
    
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            
            <span className="absolute inset-0 rounded-md bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300 ease-out" />
            
            <span className="relative flex items-center">
                {children}
            </span>
        </button>
    );
}