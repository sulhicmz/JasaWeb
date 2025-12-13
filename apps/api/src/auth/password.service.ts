import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';

export enum PasswordHashVersion {
  BCRYPT = 'bcrypt',
  ARGON2 = 'argon2',
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(private readonly configService: ConfigService) {}

  async hashPassword(
    password: string
  ): Promise<{ hash: string; version: PasswordHashVersion }> {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.configService.get<number>('ARGON2_MEMORY', 65536),
      timeCost: this.configService.get<number>('ARGON2_ITERATIONS', 3),
      parallelism: this.configService.get<number>('ARGON2_PARALLELISM', 1),
    });

    return { hash, version: PasswordHashVersion.ARGON2 };
  }

  async verifyPassword(
    password: string,
    hash: string,
    version: PasswordHashVersion = PasswordHashVersion.ARGON2
  ): Promise<{
    isValid: boolean;
    needsRehash?: boolean;
    newHash?: string;
    newVersion?: PasswordHashVersion;
  }> {
    try {
      switch (version) {
        case PasswordHashVersion.ARGON2: {
          const isValidArgon2 = await argon2.verify(hash, password);

          if (isValidArgon2) {
            const needsRehash = await this.checkIfNeedsRehash(hash);
            if (needsRehash) {
              const { hash: newHash, version: newVersion } =
                await this.hashPassword(password);
              return { isValid: true, needsRehash: true, newHash, newVersion };
            }
          }

          return { isValid: isValidArgon2 };
        }

        case PasswordHashVersion.BCRYPT: {
          const isValidBcrypt = await bcrypt.compare(password, hash);

          if (isValidBcrypt) {
            this.logger.log('Migrating bcrypt hash to Argon2');
            const { hash: newHash, version: newVersion } =
              await this.hashPassword(password);
            return { isValid: true, needsRehash: true, newHash, newVersion };
          }

          return { isValid: isValidBcrypt };
        }

        default:
          this.logger.warn(`Unknown password hash version: ${version}`);
          return { isValid: false };
      }
    } catch (error) {
      this.logger.error('Password verification failed', error);
      return { isValid: false };
    }
  }

  private async checkIfNeedsRehash(hash: string): Promise<boolean> {
    try {
      const currentOptions = {
        type: argon2.argon2id,
        memoryCost: this.configService.get<number>('ARGON2_MEMORY', 65536),
        timeCost: this.configService.get<number>('ARGON2_ITERATIONS', 3),
        parallelism: this.configService.get<number>('ARGON2_PARALLELISM', 1),
      };

      return argon2.needsRehash(hash, currentOptions);
    } catch (error) {
      this.logger.error('Failed to check if password needs rehash', error);
      return false;
    }
  }

  async validatePasswordStrength(
    password: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  generateSecurePassword(): string {
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }
}
