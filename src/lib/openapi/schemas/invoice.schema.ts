import type { OpenAPIV3 } from 'openapi-types';

export type InvoiceStatus = 'unpaid' | 'paid';

export interface InvoiceData {
  id: string;
  projectId: string;
  amount: number;
  status: InvoiceStatus;
  midtransOrderId: string | null;
  qrisUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CreateInvoiceRequestData {
  projectId: string;
  amount: number;
}

export interface PaymentResponseData {
  success: boolean;
  orderId: string;
  qrisUrl: string;
  grossAmount: number;
  paymentType: string;
  statusCode: string;
  transactionId: string | null;
  message: string;
}

export const invoiceSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    projectId: { type: 'string', format: 'uuid' },
    amount: { type: 'number', format: 'float', example: 1500000 },
    status: { type: 'string', enum: ['unpaid', 'paid'], example: 'unpaid' },
    midtransOrderId: { type: 'string', nullable: true },
    qrisUrl: { type: 'string', nullable: true, format: 'uri' },
    paidAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'projectId', 'amount', 'status', 'createdAt']
};

export const createInvoiceRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    projectId: { type: 'string', format: 'uuid' },
    amount: { type: 'number', format: 'float', minimum: 0 }
  },
  required: ['projectId', 'amount']
};

export const paymentResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    orderId: { type: 'string', example: 'ORDER-123' },
    qrisUrl: { type: 'string', format: 'uri', example: 'https://app.sandbox.midtrans.com/payment/...' },
    grossAmount: { type: 'number', format: 'float', example: 1500000 },
    paymentType: { type: 'string', example: 'qris' },
    statusCode: { type: 'string', example: '201' },
    transactionId: { type: 'string', nullable: true },
    message: { type: 'string', example: 'Success, QRIS transaction is created' }
  },
  required: ['success', 'orderId', 'qrisUrl', 'grossAmount', 'paymentType', 'statusCode', 'message']
};

export function isInvoiceStatus(status: string): status is InvoiceStatus {
  return ['unpaid', 'paid'].includes(status);
}

export function isInvoiceData(data: unknown): data is InvoiceData {
  return typeof data === 'object' && data !== null &&
    'id' in data &&
    'projectId' in data &&
    'amount' in data &&
    'status' in data &&
    'createdAt' in data &&
    typeof (data as InvoiceData).id === 'string' &&
    typeof (data as InvoiceData).amount === 'number' &&
    isInvoiceStatus((data as InvoiceData).status);
}

export function isCreateInvoiceRequestData(data: unknown): data is CreateInvoiceRequestData {
  return typeof data === 'object' && data !== null &&
    'projectId' in data &&
    'amount' in data &&
    typeof (data as CreateInvoiceRequestData).projectId === 'string' &&
    typeof (data as CreateInvoiceRequestData).amount === 'number';
}

export function isPaymentResponseData(data: unknown): data is PaymentResponseData {
  return typeof data === 'object' && data !== null &&
    'success' in data &&
    'orderId' in data &&
    'qrisUrl' in data &&
    'grossAmount' in data &&
    'paymentType' in data &&
    'statusCode' in data &&
    'message' in data &&
    typeof (data as PaymentResponseData).success === 'boolean' &&
    typeof (data as PaymentResponseData).orderId === 'string' &&
    typeof (data as PaymentResponseData).qrisUrl === 'string';
}
