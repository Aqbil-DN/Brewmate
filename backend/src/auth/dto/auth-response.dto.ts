export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  authProvider: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    id: string;
    allergenTags: string[];
    defaultOrderType: string | null;
    defaultPaymentMethod: string | null;
    aiNotificationsEnabled: boolean;
  } | null;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: SafeUser;
}
