import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { totp } from 'otplib';
import { authenticator } from 'otplib';

@Injectable()
export class TwoFactorAuthService {
  constructor(private readonly prisma: PrismaService) {
    // Configure otplib
    authenticator.options = {
      window: [1, 1], // Use a small window for verification
    };
  }

  async generateSecret(userId: string) {
    // Generate a secret key
    const secret = authenticator.generateSecret();
    
    // Create or update the TwoFactorAuth record
    const twoFactorAuth = await this.prisma.twoFactorAuth.upsert({
      where: {
        userId,
      },
      update: {
        secret,
        isVerified: false,
      },
      create: {
        userId,
        secret,
        isVerified: false,
      },
    });
    
    return {
      secret: twoFactorAuth.secret,
      qrCode: await this.generateQrCode(userId, secret),
    };
  }

  async generateQrCode(userId: string, secret: string): Promise<string> {
    // Find the user to get their email for the QR code
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate the authenticator key URI
    const keyUri = authenticator.keyuri(user.email, secret);
    return keyUri;
  }

  async verifyCode(userId: string, token: string) {
    const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      throw new BadRequestException('2FA not set up for this user');
    }

    const isValid = authenticator.check(token, twoFactorAuth.secret);

    if (isValid) {
      // Mark as verified if not already
      if (!twoFactorAuth.isVerified) {
        await this.prisma.twoFactorAuth.update({
          where: { userId },
          data: { isVerified: true },
        });
      }
      
      return { verified: true };
    } else {
      return { verified: false };
    }
  }

  async verifyCodeForLogin(userId: string, token: string) {
    const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth || !twoFactorAuth.isVerified) {
      throw new UnauthorizedException('2FA not enabled or not verified');
    }

    const isValid = authenticator.check(token, twoFactorAuth.secret);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    return true;
  }

  async enable2FA(userId: string) {
    const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      throw new BadRequestException('2FA not set up for this user');
    }

    if (!twoFactorAuth.isVerified) {
      throw new BadRequestException('2FA must be verified before enabling');
    }

    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { isVerified: true },
    });

    return { success: true, message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string) {
    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { 
        isVerified: false,
        secret: null,
      },
    });

    return { success: true, message: '2FA disabled successfully' };
  }

  async generateBackupCodes(userId: string) {
    // Generate 10 backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      backupCodes.push(code);
    }

    // Store the hashed versions of the backup codes
    const hashedCodes = await Promise.all(
      backupCodes.map(async (code) => {
        // In a real implementation, you would hash these codes
        // For now, we'll store them directly (in production, use bcrypt or similar)
        return code;
      })
    );

    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { 
        backupCodes: hashedCodes,
      },
    });

    return backupCodes;
  }

  async useBackupCode(userId: string, code: string) {
    const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
      select: { backupCodes: true },
    });

    if (!twoFactorAuth || !twoFactorAuth.backupCodes.length) {
      throw new UnauthorizedException('No backup codes available');
    }

    const codeIndex = twoFactorAuth.backupCodes.indexOf(code);
    if (codeIndex === -1) {
      throw new UnauthorizedException('Invalid backup code');
    }

    // Remove the used backup code
    const remainingCodes = [...twoFactorAuth.backupCodes];
    remainingCodes.splice(codeIndex, 1);

    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { 
        backupCodes: remainingCodes,
      },
    });

    return { success: true, remainingCodes: remainingCodes.length };
  }

  async is2FAEnabled(userId: string) {
    const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    return twoFactorAuth?.isVerified || false;
  }
}