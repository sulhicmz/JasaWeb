import { SetMetadata } from '@nestjs/common';

export enum Role {
  OrgOwner = 'org-owner',
  OrgAdmin = 'org-admin',
  Finance = 'finance',
  Reviewer = 'reviewer',
  Member = 'member',
  Guest = 'guest',
}

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);