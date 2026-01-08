export * from './common.schema';
export * from './user.schema';
export * from './project.schema';
export * from './invoice.schema';

import type { OpenAPIV3 } from 'openapi-types';
import {
  apiResponseSchema,
  paginatedResponseSchema,
  errorResponseSchema
} from './common.schema';
import {
  userSchema,
  userSessionSchema,
  loginFormSchema,
  registerFormSchema
} from './user.schema';
import {
  projectSchema
} from './project.schema';
import {
  invoiceSchema,
  createInvoiceRequestSchema,
  paymentResponseSchema
} from './invoice.schema';

export const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  ApiResponse: apiResponseSchema,
  PaginatedResponse: paginatedResponseSchema,
  User: userSchema,
  UserSession: userSessionSchema,
  Project: projectSchema,
  Invoice: invoiceSchema,
  LoginForm: loginFormSchema,
  RegisterForm: registerFormSchema,
  CreateInvoiceRequest: createInvoiceRequestSchema,
  PaymentResponse: paymentResponseSchema,
  ErrorResponse: errorResponseSchema
};
