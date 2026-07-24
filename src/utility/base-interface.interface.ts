import { Action } from 'src/enums/casl.enum';

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

/**
 * Shape of the decoded JWT payload.
 *
 * roleKey is the immutable string used for all authorization checks
 * (e.g. 'SUPER_ADMIN', 'ADMIN', 'MEMBER').
 * permissionsVersion is bumped whenever a role's permissions change,
 * invalidating the in-memory / Redis cache entry for that role.
 */
export interface IDecodeUserDetails {
  readonly iat: number;
  readonly exp: number;
  userId: number;
  email: string;
  roleKey: string;
  roleIds: number[];
  currentRoleId: number;
  tenantId?: number;
  permissionsVersion: number;
}

export interface IUserPermissions {
  action: Action;
  subject: string;
  permissionKey?: string;
  /** Optional CASL condition — used for ownership-based rules (scope: 'own') */
  conditions?: Record<string, unknown>;
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
