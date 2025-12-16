import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface MembershipContext {
  userId: string;
  organizationId: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  organization: {
    id: string;
    name: string;
    billingEmail: string;
  };
}

@Injectable()
export class OrganizationMembershipService {
  private readonly logger = new Logger(OrganizationMembershipService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Verify that a user has membership in an organization
   * @param userId The user ID
   * @param organizationId The organization ID
   * @returns Membership context with user and organization details
   * @throws UnauthorizedException if membership is not found or invalid
   */
  async verifyMembership(
    userId: string,
    organizationId: string
  ): Promise<MembershipContext> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: userId,
          organizationId: organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              billingEmail: true,
            },
          },
        },
      });

      if (!membership) {
        this.logger.warn(
          `User ${userId} attempted to access organization ${organizationId} without membership`
        );
        throw new UnauthorizedException(
          'User is not a member of this organization'
        );
      }

      // Create membership context
      const context: MembershipContext = {
        userId: membership.userId,
        organizationId: membership.organizationId,
        role: membership.role,
        user: membership.user,
        organization: membership.organization,
      };

      this.logger.debug(
        `Verified membership: User ${userId} -> Organization ${organizationId} (${membership.role})`
      );

      return context;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Error verifying membership for user ${userId} in organization ${organizationId}`,
        error
      );
      throw new UnauthorizedException(
        'Failed to verify organization membership'
      );
    }
  }

  /**
   * Check if a user has a specific role or higher in an organization
   * Role hierarchy: owner > admin > reviewer > finance > member
   * @param userId The user ID
   * @param organizationId The organization ID
   * @param requiredRole The minimum required role
   * @returns True if user has required role or higher
   */
  async hasRoleOrHigher(
    userId: string,
    organizationId: string,
    requiredRole: string
  ): Promise<boolean> {
    try {
      const membership = await this.verifyMembership(userId, organizationId);
      return this.isRoleOrHigher(membership.role, requiredRole);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a role is equal to or higher than another role in the hierarchy
   * @param userRole The user's current role
   * @param requiredRole The required role
   * @returns True if userRole is equal to or higher than requiredRole
   */
  private isRoleOrHigher(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = ['member', 'finance', 'reviewer', 'admin', 'owner'];

    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex === -1 || requiredRoleIndex === -1) {
      return false;
    }

    return userRoleIndex >= requiredRoleIndex;
  }

  /**
   * Get all organizations a user belongs to
   * @param userId The user ID
   * @returns Array of organization memberships
   */
  async getUserOrganizations(userId: string) {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: {
          userId: userId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              billingEmail: true,
              plan: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        organization: membership.organization,
        createdAt: membership.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Error fetching organizations for user ${userId}`,
        error
      );
      throw new Error('Failed to fetch user organizations');
    }
  }

  /**
   * Get all members of an organization
   * @param organizationId The organization ID
   * @returns Array of organization members
   */
  async getOrganizationMembers(organizationId: string) {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: {
          organizationId: organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        user: membership.user,
        createdAt: membership.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Error fetching members for organization ${organizationId}`,
        error
      );
      throw new Error('Failed to fetch organization members');
    }
  }
}
