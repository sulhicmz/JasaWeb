import React from 'react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  className = '',
}) => {
  const changeColors = {
    increase: 'text-green-400',
    decrease: 'text-red-400',
    neutral: 'text-slate-400',
  };

  return (
    <div className={`glass-panel p-6 rounded-xl ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-2">{value}</p>
          {change && (
            <div className="flex items-center space-x-1">
              <span
                className={`text-sm font-medium ${changeColors[change.type]}`}
              >
                {change.type === 'increase' && '+'}
                {change.value}%
              </span>
              <span className="text-xs text-slate-500">vs last period</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-2">{description}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { StatsCard };
