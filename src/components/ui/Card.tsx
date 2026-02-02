import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-card border-card rounded-lg ${className}`}>
            {children}
        </div>
    );
}