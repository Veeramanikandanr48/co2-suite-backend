import { RoleActions, RoleFeatures } from 'src/enums/casl.enum';

export interface ICommonListPayload {
  offSet?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: number;
}

export interface ICommonSortFieldObject {
  [key: string]: string;
}

export interface IMailDetails {
  name?: string;
  email: string;
  subject: string;
  template: string;
  context: {
    name?: string;
    url?: string;
    token?: string;
    expires?: string;
    otp?: string;
  };
}

export interface IDecodeUserDetails {
  readonly iat: number;
  readonly exp: number;
  id?: number;
  roleId: number;
  userId: number;
  organizationId?: number;
  email?: string;
  currentRoleId?: number;
  serviceDetails?: {
    masterServiceTypeId?: number;
    servicePartnerId?: number;
  };
  roleIds?: number[];
}

export interface IUserPermissions {
  action: RoleActions;
  subject: RoleFeatures;
}

export interface ILoggerMethods {
  info(message: string): void;
  error(message: string, options?: unknown): void;
}

export interface IResponse<T> {
  message: string;
  data?: T;
  success: boolean;
}
