import { Request } from 'express';
import { User } from '@prisma/client';

export interface RequestWithAuth extends Request {
  user?: User;
  organizationId?: string;
  membership?: {
    id: string;
    role: string;
  };
}
