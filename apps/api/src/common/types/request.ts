import { Request } from 'express';
import { User } from '@prisma/client';
import { Organization } from '@prisma/client';

export interface RequestWithAuth extends Request {
  user?: User & {
    organizationId?: string;
    organization?: Organization;
    role?: string;
  };
  organizationId?: string;
  organization?: Organization;
}
