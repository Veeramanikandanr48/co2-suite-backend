import { SetMetadata } from '@nestjs/common';
import { MasterRole } from 'src/enums/casl.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to declare which MasterRole(s) are allowed to access a route.
 *
 * Usage:
 *   @Roles(MasterRole.SUPER_ADMIN)
 *   @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
 *
 * Enforced by RolesGuard, which reads the JWT user's roleId
 * and compares it against the metadata set here.
 */
export const Roles = (...roles: MasterRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
