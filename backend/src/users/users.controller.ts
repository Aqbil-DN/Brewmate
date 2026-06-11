import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

/**
 * JwtStrategy.validate() returns the full safe user object (not raw JWT payload).
 * So request.user has `id`, NOT `sub`.
 */
interface JwtUser {
  id: string;
  email: string;
  authProvider: string;
}

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Profile ────────────────────────────────────────────────────────────────

  /** GET /api/v1/users/me */
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully.' })
  @Get('me')
  getProfile(@CurrentUser() user: JwtUser) {
    return this.usersService.getProfile(user.id);
  }

  /** PATCH /api/v1/users/me */
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @Patch('me')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  // ── Preferences ────────────────────────────────────────────────────────────

  /** GET /api/v1/users/preferences */
  @Get('preferences')
  getPreferences(@CurrentUser() user: JwtUser) {
    return this.usersService.getPreferences(user.id);
  }

  /** PATCH /api/v1/users/preferences */
  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(user.id, dto);
  }

  // ── Addresses ──────────────────────────────────────────────────────────────

  /** GET /api/v1/users/addresses */
  @Get('addresses')
  getAddresses(@CurrentUser() user: JwtUser) {
    return this.usersService.getAddresses(user.id);
  }

  /** POST /api/v1/users/addresses */
  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  createAddress(@CurrentUser() user: JwtUser, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user.id, dto);
  }

  /** PATCH /api/v1/users/addresses/:id */
  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, id, dto);
  }

  /** DELETE /api/v1/users/addresses/:id */
  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  deleteAddress(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.id, id);
  }

  /** PATCH /api/v1/users/addresses/:id/default */
  @Patch('addresses/:id/default')
  setDefaultAddress(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.usersService.setDefaultAddress(user.id, id);
  }
}
