import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';
import { OrderType, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Profile ────────────────────────────────────────────────────────────────

  /**
   * Return the full profile for the authenticated user.
   * Includes preferences and sorted addresses (default first).
   * Address model has no createdAt — sort by id asc as fallback.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPreferences: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AppErrorCodes.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    const { passwordHash, userPreferences, ...rest } = user;
    return { ...rest, preferences: userPreferences };
  }

  /**
   * Update current user's profile fields.
   * Email, authProvider, isVerified, isActive cannot be changed here.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check phone uniqueness if provided
    if (dto.phoneNumber) {
      const phoneOwner = await this.prisma.user.findFirst({
        where: {
          phoneNumber: dto.phoneNumber,
          NOT: { id: userId },
        },
      });
      if (phoneOwner) {
        throw new ConflictException({
          code: AppErrorCodes.PHONE_ALREADY_EXISTS,
          message: 'Phone number is already in use by another account.',
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      include: {
        userPreferences: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
        },
      },
    });

    const { passwordHash, userPreferences, ...rest } = user;
    return { ...rest, preferences: userPreferences };
  }

  // ── Preferences ────────────────────────────────────────────────────────────

  /**
   * Return preferences. If not found, create defaults via upsert.
   */
  async getPreferences(userId: string) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        allergenTags: [],
        defaultOrderType: OrderType.pickup,
        defaultPaymentMethod: 'xendit',
        aiNotificationsEnabled: true,
      },
      update: {},
    });
  }

  /**
   * Update user preferences (upsert in case row was deleted).
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        allergenTags: dto.allergenTags ?? [],
        defaultOrderType: dto.defaultOrderType ?? OrderType.pickup,
        defaultPaymentMethod: dto.defaultPaymentMethod ?? 'xendit',
        aiNotificationsEnabled: dto.aiNotificationsEnabled ?? true,
      },
      update: {
        ...(dto.allergenTags !== undefined && {
          allergenTags: dto.allergenTags,
        }),
        ...(dto.defaultOrderType !== undefined && {
          defaultOrderType: dto.defaultOrderType,
        }),
        ...(dto.defaultPaymentMethod !== undefined && {
          defaultPaymentMethod: dto.defaultPaymentMethod,
        }),
        ...(dto.aiNotificationsEnabled !== undefined && {
          aiNotificationsEnabled: dto.aiNotificationsEnabled,
        }),
      },
    });
  }

  // ── Addresses ──────────────────────────────────────────────────────────────

  /**
   * Return all addresses for the user, default first.
   */
  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
  }

  /**
   * Create a new address.
   * If isDefault = true, unset all other defaults first (transaction).
   * If this is the first address, auto-set as default.
   */
  async createAddress(userId: string, dto: CreateAddressDto) {
    const existingCount = await this.prisma.address.count({
      where: { userId },
    });

    // Auto-default if first address or explicitly requested
    const makeDefault = dto.isDefault ?? existingCount === 0;

    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: dto.label,
          fullAddress: dto.fullAddress,
          city: dto.city,
          lat: dto.lat !== undefined ? new Prisma.Decimal(dto.lat) : null,
          lng: dto.lng !== undefined ? new Prisma.Decimal(dto.lng) : null,
          isDefault: makeDefault,
        },
      });
    });
  }

  /**
   * Update an address. Only the owner can update.
   */
  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: AppErrorCodes.ADDRESS_NOT_FOUND,
        message: 'Address not found.',
      });
    }

    const makeDefault = dto.isDefault === true;

    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.fullAddress !== undefined && {
            fullAddress: dto.fullAddress,
          }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.lat !== undefined && {
            lat: new Prisma.Decimal(dto.lat),
          }),
          ...(dto.lng !== undefined && {
            lng: new Prisma.Decimal(dto.lng),
          }),
          ...(dto.isDefault !== undefined && { isDefault: makeDefault }),
        },
      });
    });
  }

  /**
   * Delete an address. Only the owner can delete.
   * If deleted address was default, promote the next remaining address.
   */
  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: AppErrorCodes.ADDRESS_NOT_FOUND,
        message: 'Address not found.',
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.address.delete({ where: { id: addressId } });

        // If deleted address was the default, promote the next one
        if (address.isDefault) {
          const next = await tx.address.findFirst({
            where: { userId },
            orderBy: { id: 'asc' },
          });
          if (next) {
            await tx.address.update({
              where: { id: next.id },
              data: { isDefault: true },
            });
          }
        }
      });
    } catch (err) {
      // Handle FK constraint violation (address linked to orders)
      const prismaErr = err as { code?: string };
      if (prismaErr.code === 'P2003') {
        throw new BadRequestException({
          code: AppErrorCodes.ADDRESS_DELETE_RESTRICTED,
          message:
            'This address is linked to an order history and cannot be deleted.',
        });
      }
      throw err;
    }

    return { deleted: true };
  }

  /**
   * Set one address as default using a transaction.
   */
  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: AppErrorCodes.ADDRESS_NOT_FOUND,
        message: 'Address not found.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }
}
