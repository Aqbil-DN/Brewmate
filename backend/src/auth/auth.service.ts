import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto, SafeUser } from './dto/auth-response.dto.js';
import { AuthProvider, OrderType } from '@prisma/client';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
}
