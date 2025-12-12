import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  description
}) => {
  return (
    <div className={`rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-md shadow-2xl ${className}`}>
      {(title || description) && (
        <div className="p-6 pb-4">
          {title && <h3 className="font-semibold leading-none tracking-tight mb-1">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className={!title && !description ? 'p-6' : 'px-6 pt-0 pb-6'}>
        {children}
      </div>
    </div>
  );
};

export { Card };
