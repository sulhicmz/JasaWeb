import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { UsersService } from '../../users/users.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

export interface MfaSetupDto {
  token: string;
}

export interface MfaVerifyDto {
  token: string;
  backupCode?: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService
  ) {}

  /**
   * Generate MFA secret and backup codes for user
   */
  async generateMfaSecret(userId: string): Promise<MfaSetupResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `JasaWeb (${user.email})`,
      issuer: 'JasaWeb',
      length: 32,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    // Store MFA settings (but don't enable yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret.base32,
        mfaBackupCodes: backupCodes,
        mfaEnabled: false, // Will be enabled after verification
      },
    });

    this.logger.log(`MFA secret generated for user ${userId}`);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Enable MFA after user verifies the setup
   */
  async enableMfa(
    userId: string,
    mfaSetupDto: MfaSetupDto
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    // Verify the token
    const isValid = this.verifyToken(user.mfaSecret, mfaSetupDto.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaVerifiedAt: new Date(),
      },
    });

    this.logger.log(`MFA enabled for user ${userId}`);

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA for user
   */
  async disableMfa(
    userId: string,
    password: string
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify password before disabling MFA
    const isPasswordValid = await this.usersService.validatePassword(
      user.email,
      password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Clear MFA settings
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        mfaVerifiedAt: null,
      },
    });

    this.logger.log(`MFA disabled for user ${userId}`);

    return { message: 'MFA disabled successfully' };
  }

  /**
   * Verify MFA token during login
   */
  async verifyMfaToken(
    userId: string,
    mfaVerifyDto: MfaVerifyDto
  ): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA not enabled for user');
    }

    // Try TOTP token first
    if (mfaVerifyDto.token) {
      const isValid = this.verifyToken(user.mfaSecret!, mfaVerifyDto.token);
      if (isValid) {
        this.logger.log(`MFA token verified for user ${userId}`);
        return true;
      }
    }

    // Try backup codes if TOTP failed
    if (mfaVerifyDto.backupCode && user.mfaBackupCodes) {
      const isValidBackupCode = this.verifyBackupCode(
        user.mfaBackupCodes,
        mfaVerifyDto.backupCode
      );
      if (isValidBackupCode) {
        // Remove used backup code
        const updatedBackupCodes = user.mfaBackupCodes.filter(
          (code) => code !== mfaVerifyDto.backupCode
        );
        await this.prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: updatedBackupCodes },
        });

        this.logger.log(`MFA backup code used for user ${userId}`);
        return true;
      }
    }

    this.logger.warn(`Failed MFA verification attempt for user ${userId}`);
    return false;
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    password: string
  ): Promise<string[]> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify password before regenerating backup codes
    const isPasswordValid = await this.usersService.validatePassword(
      user.email,
      password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const backupCodes = this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: backupCodes },
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);

    return backupCodes;
  }

  /**
   * Check if user has MFA enabled
   */
  async isMfaEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    return user?.mfaEnabled || false;
  }

  /**
   * Verify TOTP token
   */
  private verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 steps before and after for clock drift
    });
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(
        speakeasy
          .generateSecret({ length: 8 })
          .base32.substring(0, 8)
          .toUpperCase()
      );
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  private verifyBackupCode(
    storedCodes: string[],
    providedCode: string
  ): boolean {
    return storedCodes.includes(providedCode.toUpperCase());
  }
}
