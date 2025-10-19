import React from 'react';

interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  noValidate?: boolean;
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: string;
}

interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Form = ({
  children,
  onSubmit,
  className = '',
  noValidate = false,
  ...props
}: FormProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className={`space-y-6 ${className}`.trim()}
      noValidate={noValidate}
      {...props}
    >
      {children}
    </form>
  );
};

export const FormField = ({
  children,
  className = '',
  error
}: FormFieldProps) => {
  return (
    <div className={`space-y-2 ${error ? 'mb-1' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
};

export const FormLabel = ({
  children,
  htmlFor,
  required = false,
  className = ''
}: FormLabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 ${className}`.trim()}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export const FormError = ({
  children,
  className = '',
  id
}: FormErrorProps) => {
  if (!children) return null;

  return (
    <p
      id={id}
      className={`mt-1 text-sm text-red-600 ${className}`.trim()}
      role="alert"
    >
      {children}
    </p>
  );
};

export const FormDescription = ({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={`text-sm text-gray-500 ${className}`.trim()}>
      {children}
    </p>
  );
};