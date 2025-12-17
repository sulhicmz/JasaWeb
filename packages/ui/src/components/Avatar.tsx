import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
    xl: 'h-12 w-12 text-lg',
  };

  if (src) {
    // Security: Validate className to prevent injection
    const allowedClasses = new Set(['rounded-full', 'object-cover']);
    const sanitizedClassName = className
      .split(' ')
      .filter(
        (cls) =>
          allowedClasses.has(cls) ||
          cls.startsWith('w-') ||
          cls.startsWith('h-')
      )
      .join(' ');

    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`rounded-full object-cover ${sizeClasses[size]} ${sanitizedClassName}`}
      />
    );
  }

  // Security: Validate className to prevent injection
  const allowedClasses = new Set([
    'rounded-full',
    'bg-gradient-to-br',
    'from-blue-500',
    'to-indigo-600',
    'flex',
    'items-center',
    'justify-center',
    'text-white',
    'font-medium',
  ]);
  const sanitizedClassName = className
    .split(' ')
    .filter(
      (cls) =>
        allowedClasses.has(cls) || cls.startsWith('w-') || cls.startsWith('h-')
    )
    .join(' ');

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium ${sizeClasses[size]} ${sanitizedClassName}`}
    >
      {fallback || '?'}
    </div>
  );
};

export { Avatar };
