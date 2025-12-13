import React from 'react';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
  showLabel?: boolean;
  label?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  className = '',
  showLabel = false,
  label,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-300">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-slate-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-700 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export { Progress };
