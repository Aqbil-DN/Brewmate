import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { FirebaseLoginDto } from './dto/firebase-login.dto.js';
import { AuthResponseDto, SafeUser } from './dto/auth-response.dto.js';
import { FirebaseAdminService } from './firebase-admin.service.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthProvider, OrderType } from '@prisma/client';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const email = registerDto.email.toLowerCase();

    // Check unique email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException({
        code: AppErrorCodes.AUTH_EMAIL_ALREADY_EXISTS,
        message: 'Email address is already registered',
      });
    }

    // Check unique phone number if provided
    if (registerDto.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: registerDto.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException({
          code: AppErrorCodes.AUTH_PHONE_ALREADY_EXISTS,
          message: 'Phone number is already registered',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user, user preference, and cart inside a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName: registerDto.fullName,
          phoneNumber: registerDto.phoneNumber,
          authProvider: AuthProvider.email,
          isVerified: false,
          isActive: true,
        },
      });

      await tx.userPreference.create({
        data: {
          userId: newUser.id,
          allergenTags: [],
          defaultOrderType: OrderType.pickup,
          defaultPaymentMethod: 'xendit',
          aiNotificationsEnabled: true,
        },
      });

      await tx.cart.create({
        data: {
          userId: newUser.id,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: newUser.id },
        include: { userPreferences: true },
      });
    });

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      authProvider: user.authProvider,
    };
    const accessToken = this.jwtService.sign(tokenPayload);

    const { passwordHash, userPreferences, ...rest } = user;
    const safeUser: SafeUser = {
      ...rest,
      preferences: userPreferences,
    };

    return {
      accessToken,
      user: safeUser,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const email = loginDto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { userPreferences: true },
    });

    // Use generic invalid credentials error for safety
    if (!user) {
      throw new BadRequestException({
        code: AppErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      throw new BadRequestException({
        code: AppErrorCodes.AUTH_ACCOUNT_INACTIVE,
        message: 'Your account is deactivated',
      });
    }

    // Reject if passwordHash is null (OAuth-only account)
    if (!user.passwordHash) {
      throw new BadRequestException({
        code: AppErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException({
        code: AppErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      authProvider: user.authProvider,
    };
    const accessToken = this.jwtService.sign(tokenPayload);

    const { passwordHash, userPreferences, ...rest } = user;
    const safeUser: SafeUser = {
      ...rest,
      preferences: userPreferences,
    };

    return {
      accessToken,
      user: safeUser,
    };
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        userPreferences: true,
        addresses: true,
      },
    });

    const { passwordHash, userPreferences, ...rest } = user;
    return {
      ...rest,
      preferences: userPreferences,
    };
  }

  /**
   * Authenticate a user via Firebase Google Sign-In.
   *
   * Verifies the Firebase ID token, then creates or finds the user
   * and returns a BrewMate app JWT.
   */
  async firebaseGoogleLogin(dto: FirebaseLoginDto): Promise<AuthResponseDto> {
    // 1. Verify Firebase ID token
    let decoded: DecodedIdToken;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      decoded = await this.firebaseAdminService.verifyIdToken(dto.idToken);
    } catch {
      this.logger.warn('Invalid Firebase ID token received');
      throw new BadRequestException({
        code: AppErrorCodes.AUTH_INVALID_FIREBASE_TOKEN,
        message: 'Invalid Google sign-in token.',
      });
    }

    // 2. Extract email — reject if missing
    const email = decoded.email?.toLowerCase();
    if (!email) {
      throw new BadRequestException({
        code: AppErrorCodes.AUTH_GOOGLE_EMAIL_MISSING,
        message: 'Google account does not have an associated email address.',
      });
    }

    // 3. Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { userPreferences: true },
    });

    if (!user) {
      // Create new Google user with transaction
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash: null,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            fullName: decoded.name || email.split('@')[0],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            avatarUrl: decoded.picture ?? null,
            authProvider: AuthProvider.google,
            isVerified: decoded.email_verified ?? false,
            isActive: true,
          },
          include: { userPreferences: true },
        });

        await tx.userPreference.create({
          data: {
            userId: newUser.id,
            allergenTags: [],
            defaultOrderType: OrderType.pickup,
            defaultPaymentMethod: 'xendit',
            aiNotificationsEnabled: true,
          },
        });

        await tx.cart.create({
          data: {
            userId: newUser.id,
          },
        });

        // Re-fetch with preferences included
        return tx.user.findUniqueOrThrow({
          where: { id: newUser.id },
          include: { userPreferences: true },
        });
      });
    } else {
      // Existing user — validate and update
      if (!user.isActive) {
        throw new BadRequestException({
          code: AppErrorCodes.AUTH_ACCOUNT_INACTIVE,
          message: 'Your account is deactivated.',
        });
      }

      // Build update payload for missing profile data
      const updateData: Record<string, unknown> = {};
      if (!user.avatarUrl && decoded.picture) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        updateData.avatarUrl = decoded.picture;
      }
      if (!user.fullName && decoded.name) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        updateData.fullName = decoded.name;
      }

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: { userPreferences: true },
        });
      }
    }

    // 4. Sign app JWT
    const accessToken = this.signAppJwt(user);

    // 5. Return safe response
    return this.buildAuthResponse(user, accessToken);
  }

  // ── Private helpers ──────────────────────────────────────

  /**
   * Sign a BrewMate app JWT for the given user.
   */
  private signAppJwt(user: {
    id: string;
    email: string;
    authProvider: AuthProvider;
  }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      authProvider: user.authProvider,
    });
  }

  /**
   * Strip sensitive fields and build the auth response DTO.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildAuthResponse(user: any, accessToken: string): AuthResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
    const { passwordHash, userPreferences, ...rest } = user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const safeUser: SafeUser = {
      ...rest,
      preferences: userPreferences,
    };
    return { accessToken, user: safeUser };
  }
}
