import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { addMinutes, isAfter } from 'date-fns';

@Injectable()
export class AccountLockoutService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(private prisma: PrismaService) {}

  async handleFailedLogin(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return;

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: user.failedLoginAttempts + 1,
        lastLoginAttempt: new Date(),
        lockedUntil:
          user.failedLoginAttempts + 1 >= this.MAX_FAILED_ATTEMPTS
            ? addMinutes(new Date(), this.LOCKOUT_DURATION_MINUTES)
            : user.lockedUntil,
      },
    });

    if (updatedUser.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
      await this.logSecurityEvent(
        user.id,
        'account_locked',
        `Account locked after ${updatedUser.failedLoginAttempts} failed attempts`
      );
    }
  }

  async handleSuccessfulLogin(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAttempt: new Date(),
      },
    });

    await this.logSecurityEvent(
      user.id,
      'login_success',
      'User logged in successfully'
    );
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.lockedUntil) return false;

    const now = new Date();
    if (isAfter(now, user.lockedUntil)) {
      await this.unlockAccount(user.id);
      return false;
    }

    return true;
  }

  async getLockoutStatus(email: string): Promise<{
    isLocked: boolean;
    remainingAttempts: number;
    lockoutExpiresAt?: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        isLocked: false,
        remainingAttempts: this.MAX_FAILED_ATTEMPTS,
      };
    }

    const isLocked = await this.isAccountLocked(email);
    const remainingAttempts = Math.max(
      0,
      this.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts
    );

    return {
      isLocked,
      remainingAttempts,
      lockoutExpiresAt: user.lockedUntil || undefined,
    };
  }

  async unlockAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.logSecurityEvent(
      userId,
      'account_unlocked',
      'Account manually unlocked'
    );
  }

  async forceLockAccount(userId: string, reason: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: addMinutes(new Date(), this.LOCKOUT_DURATION_MINUTES),
        lastLoginAttempt: new Date(),
      },
    });

    await this.logSecurityEvent(userId, 'account_force_locked', reason);
  }

  private async logSecurityEvent(
    userId: string,
    action: string,
    details: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { take: 1 } },
    });

    if (user?.memberships[0]?.organizationId) {
      await this.prisma.auditLog.create({
        data: {
          organizationId: user.memberships[0].organizationId,
          actorId: userId,
          action,
          target: 'User',
          meta: {
            details,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  }

  getMaxFailedAttempts(): number {
    return this.MAX_FAILED_ATTEMPTS;
  }

  getLockoutDurationMinutes(): number {
    return this.LOCKOUT_DURATION_MINUTES;
  }
}
