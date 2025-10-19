import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const shadowClasses = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

export const Card = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  rounded = 'lg'
}: CardProps) => {
  const baseClasses = 'bg-white border border-gray-200';

  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${roundedClasses[rounded]} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
  padding = 'md'
}: CardSectionProps) => {
  return (
    <div className={`border-b border-gray-100 ${paddingClasses[padding]} ${className}`.trim()}>
      {children}
    </div>
  );
};

export const CardContent = ({
  children,
  className = '',
  padding = 'md'
}: CardSectionProps) => {
  return (
    <div className={`${paddingClasses[padding]} ${className}`.trim()}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className = '',
  padding = 'md'
}: CardSectionProps) => {
  return (
    <div className={`border-t border-gray-100 ${paddingClasses[padding]} ${className}`.trim()}>
      {children}
    </div>
  );
};