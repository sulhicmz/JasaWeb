import type { OpenAPIV3 } from 'openapi-types';

export type UserRole = 'admin' | 'client';

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export interface UserSessionData {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export const userSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    name: { type: 'string', example: 'John Doe' },
    phone: { type: 'string', nullable: true, example: '+62812345678' },
    role: { type: 'string', enum: ['admin', 'client'], example: 'client' },
    createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' }
  },
  required: ['id', 'email', 'name', 'role', 'createdAt']
};

export const userSessionSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['admin', 'client'] }
  },
  required: ['id', 'email', 'name', 'role']
};

export const loginFormSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
  },
  required: ['email', 'password']
};

export const registerFormSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2, example: 'John Doe' },
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    phone: { type: 'string', nullable: true, example: '+62812345678' },
    password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
  },
  required: ['name', 'email', 'password']
};

export function isUserRole(role: string): role is UserRole {
  return role === 'admin' || role === 'client';
}

export function isUserData(data: unknown): data is UserData {
  return typeof data === 'object' && data !== null &&
    'id' in data &&
    'email' in data &&
    'name' in data &&
    'role' in data &&
    'createdAt' in data &&
    typeof (data as UserData).id === 'string' &&
    typeof (data as UserData).email === 'string' &&
    isUserRole((data as UserData).role);
}

export function isLoginFormData(data: unknown): data is LoginFormData {
  return typeof data === 'object' && data !== null &&
    'email' in data &&
    'password' in data &&
    typeof (data as LoginFormData).email === 'string' &&
    typeof (data as LoginFormData).password === 'string';
}

export function isRegisterFormData(data: unknown): data is RegisterFormData {
  return typeof data === 'object' && data !== null &&
    'name' in data &&
    'email' in data &&
    'password' in data &&
    typeof (data as RegisterFormData).name === 'string' &&
    typeof (data as RegisterFormData).email === 'string' &&
    typeof (data as RegisterFormData).password === 'string' &&
    (data as RegisterFormData).name.trim().length >= 2;
}
