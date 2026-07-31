export interface ILoginInfo {
  id: number;
  email: string;
  password: string;
  userName: string;
  roleId?: number;
  organizationId?: number;
  firstName?: string;
  lastName?: string;
  isBlocked: boolean;
  attemptedCount: number;
  blockedTime: Date;
  isActive: boolean;
  isVerified: boolean;
  uAuthId: number | null;
  masterLoginTypeId: number | null;
  updatedAt: Date;
  profileImageKey?: string;
  isTwoFactorAuthenticationEnabled: boolean;
}
export interface ICreateUser {
  userName: string;
  email: string;
  password?: string;
  googleSubId?: string;
  isVerified?: boolean;
  roleId?: number;
  organizationId?: number;
  firstName?: string;
  lastName?: string;
}

export interface IUserAuthData {
  attemptedCount: number;
  userId: number;
  id?: number;
  isBlocked: boolean;
  blockedTime: Date;
  masterLoginTypeId: number;
  updatedAt?: Date;
}

export interface IQRGnerateResponse {
  secretKey: string;
  qrcode: string;
}

export interface IUserStatus {
  id: number;
  isActive: boolean;
}

export interface IUserInfo {
  id: number;
  secret: string;
  code: string;
}

export interface IUserEmailVerificaiton {
  email: string;
  otp: string;
  createdBy: number;
}
