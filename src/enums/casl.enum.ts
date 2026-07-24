/**
 * Action — the only enum kept for authorization.
 *
 * Roles, modules, features, and permissions all live in the database
 * and are managed dynamically. Only actions are enum-controlled to
 * preserve compile-time safety on the action axis.
 */
export enum Action {
  CREATE   = 'create',
  READ     = 'read',
  UPDATE   = 'update',
  DELETE   = 'delete',
  MANAGE   = 'manage',
  APPROVE  = 'approve',
  REJECT   = 'reject',
  DOWNLOAD = 'download',
}

/**
 * @deprecated Use Action enum instead.
 * Kept temporarily for backward compatibility with existing @CheckPermissions() usages.
 */
export enum RoleActions {
  CREATE   = 'create',
  READ     = 'read',
  UPDATE   = 'update',
  DELETE   = 'delete',
  MANAGE   = 'manage',
  DOWNLOAD = 'download',
  APPROVE  = 'approve',
  REJECT   = 'reject',
}

/**
 * MasterRole — numeric role IDs matching the seeded master_roles rows.
 * Used only for seeding defaults. Authorization should use roleKey strings.
 */
export enum MasterRole {
  SUPER_ADMIN = 1,
  ADMIN       = 2,
}
