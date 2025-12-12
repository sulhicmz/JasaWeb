import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { AccountLockoutService } from '../auth/account-lockout.service';
import { PrismaService } from '../common/database/prisma.service';

interface UnlockAccountDto {
  reason: string;
}

interface LockAccountDto {
  reason: string;
}

@Controller('admin/accounts')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.OrgAdmin, Role.OrgOwner)
export class AccountManagementController {
  constructor(
    private accountLockoutService: AccountLockoutService,
    private prisma: PrismaService
  ) {}

  @Post(':userId/unlock')
  @HttpCode(HttpStatus.OK)
  async unlockAccount(
    @Param('userId') userId: string,
    @Body() body: UnlockAccountDto,
    @Request() req: any
  ) {
    await this.accountLockoutService.unlockAccount(userId);

    return {
      message: 'Account unlocked successfully',
      unlockedBy: req.user.id,
      reason: body.reason,
    };
  }

  @Post(':userId/lock')
  @HttpCode(HttpStatus.OK)
  async lockAccount(
    @Param('userId') userId: string,
    @Body() body: LockAccountDto,
    @Request() req: any
  ) {
    await this.accountLockoutService.forceLockAccount(userId, body.reason);

    return {
      message: 'Account locked successfully',
      lockedBy: req.user.id,
      reason: body.reason,
    };
  }

  @Get(':userId/status')
  async getAccountStatus(@Param('userId') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLoginAttempt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const isLocked = user.lockedUntil ? user.lockedUntil > new Date() : false;
    const maxAttempts = this.accountLockoutService.getMaxFailedAttempts();
    const remainingAttempts = Math.max(
      0,
      maxAttempts - user.failedLoginAttempts
    );

    return {
      user: {
        ...user,
        isLocked,
        remainingAttempts,
        maxAttempts,
        lockoutDurationMinutes:
          this.accountLockoutService.getLockoutDurationMinutes(),
      },
    };
  }

  @Get('locked')
  async getLockedAccounts() {
    const lockedUsers = await this.prisma.user.findMany({
      where: {
        lockedUntil: {
          not: null,
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLoginAttempt: true,
      },
    });

    return {
      lockedAccounts: lockedUsers.map((user: any) => ({
        ...user,
        isLocked: true,
        timeRemaining: user.lockedUntil
          ? Math.max(0, user.lockedUntil.getTime() - new Date().getTime())
          : 0,
      })),
    };
  }
}
