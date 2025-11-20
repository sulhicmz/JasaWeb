import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RefreshTokenService } from './refresh-token.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { SecurityMonitoringService } from '../security/monitoring/security-monitoring.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private securityService: SecurityMonitoringService,
    private auditService: AuditService
  ) {}

  async register(
    createUserDto: CreateUserDto,
    request?: any
  ): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: { id: any; email: any; name: any; profilePicture: any };
  }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email
    );
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Generate JWT token and refresh token
    const { token, refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken(user.id);

    // Log security event
    await this.securityService.recordSecurityEvent({
      type: 'login_attempt',
      userId: user.id,
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.headers?.['user-agent'] || 'unknown',
      success: true,
      details: { registration: true },
      riskScore: 10, // Low risk for registration
    });

    // Log to audit service
    await this.auditService.logUserLogin(user.id, 'system');

    return {
      access_token: token,
      refreshToken: refreshToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
    };
  }

  async login(
    loginUserDto: LoginUserDto,
    request?: any
  ): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: { id: any; email: any; name: any; profilePicture: any };
    requiresMfa?: boolean;
  }> {
    const user = await this.usersService.findByEmail(loginUserDto.email);
    const ipAddress = request?.ip || 'unknown';
    const userAgent = request?.headers?.['user-agent'] || 'unknown';

    if (!user) {
      // Log failed login attempt
      await this.securityService.recordSecurityEvent({
        type: 'login_attempt',
        ipAddress,
        userAgent,
        success: false,
        details: { reason: 'user_not_found', email: loginUserDto.email },
        riskScore: 40,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password
    );
    if (!isPasswordValid) {
      // Log failed login attempt
      await this.securityService.recordSecurityEvent({
        type: 'login_attempt',
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        details: { reason: 'invalid_password' },
        riskScore: 50,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Generate temporary token for MFA verification
      const tempToken = this.jwtService.sign(
        {
          userId: user.id,
          mfaRequired: true,
          temp: true,
        },
        {
          expiresIn: '5m', // Short-lived for MFA verification
        }
      );

      // Log successful password verification (but not full login yet)
      await this.securityService.recordSecurityEvent({
        type: 'login_attempt',
        userId: user.id,
        ipAddress,
        userAgent,
        success: true,
        details: { mfa_required: true },
        riskScore: 20,
      });

      return {
        access_token: tempToken,
        refreshToken: '', // Empty until MFA is verified
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
        },
        requiresMfa: true,
      };
    }

    // Generate JWT token and refresh token
    const { token, refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken(user.id);

    // Log successful login
    await this.securityService.recordSecurityEvent({
      type: 'login_attempt',
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
      details: { mfa_required: false },
      riskScore: 10,
    });

    // Log to audit service
    await this.auditService.logUserLogin(user.id, 'system');

    return {
      access_token: token,
      refreshToken: refreshToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
    };
  }

  async verifyMfaAndCompleteLogin(
    userId: string,
    mfaToken: string,
    request?: any
  ): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: any;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify MFA token
    const mfaService = require('../security/mfa/mfa.service').MfaService;
    const mfaServiceInstance = new mfaService(
      require('../common/database/prisma.service').PrismaService.prototype,
      this.usersService
    );

    const isValid = await mfaServiceInstance.verifyMfaToken(userId, {
      token: mfaToken,
    });
    if (!isValid) {
      // Log failed MFA verification
      await this.securityService.recordSecurityEvent({
        type: 'mfa_verification',
        userId,
        ipAddress: request?.ip || 'unknown',
        userAgent: request?.headers?.['user-agent'] || 'unknown',
        success: false,
        details: { reason: 'invalid_mfa_token' },
        riskScore: 60,
      });
      throw new UnauthorizedException('Invalid MFA token');
    }

    // Generate final tokens
    const { token, refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken(user.id);

    // Log successful MFA verification and complete login
    await this.securityService.recordSecurityEvent({
      type: 'mfa_verification',
      userId,
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.headers?.['user-agent'] || 'unknown',
      success: true,
      details: { login_completed: true },
      riskScore: 15,
    });

    // Log to audit service
    await this.auditService.logUserLogin(userId, 'system');

    return {
      access_token: token,
      refreshToken: refreshToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    request?: any
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await this.securityService.recordSecurityEvent({
        type: 'password_change',
        userId,
        ipAddress: request?.ip || 'unknown',
        userAgent: request?.headers?.['user-agent'] || 'unknown',
        success: false,
        details: { reason: 'invalid_current_password' },
        riskScore: 70,
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.usersService.update(userId, { password: hashedNewPassword });

    // Revoke all existing sessions for security
    await this.refreshTokenService.revokeAllRefreshTokens(userId);

    // Log successful password change
    await this.securityService.recordSecurityEvent({
      type: 'password_change',
      userId,
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.headers?.['user-agent'] || 'unknown',
      success: true,
      details: { sessions_revoked: true },
      riskScore: 20,
    });

    // Log to audit service
    await this.auditService.log({
      actorId: userId,
      organizationId: 'system',
      action: 'password_changed',
      target: 'User',
      targetId: userId,
    });

    return { message: 'Password changed successfully' };
  }
}
