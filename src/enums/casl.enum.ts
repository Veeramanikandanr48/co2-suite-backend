export enum RoleActions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  DOWNLOAD = 'download',
  APPROVE = 'approve',
  REJECT = 'reject',
}

export enum RoleFeatures {
  PROFILE = 'profile',
}

export enum MasterRole {
  SUPER_ADMIN = 1,
  ADMIN = 2,
  USER = 3,
}
