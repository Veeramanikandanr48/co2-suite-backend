import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MasterRole } from 'src/enums/casl.enum';
import { ROLES_KEY } from './roles.decorator';

/**
 * Guard that enforces role-based access control (RBAC) using the @Roles() decorator.
 *
 * Place AFTER AuthGuard('jwt') so that req.user is already populated by Passport.
 * If req.user is missing (unauthenticated request), passes control to AuthGuard('jwt')
 * to return 401 Unauthorized.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MasterRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() metadata means any authenticated user can proceed.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { roleId?: number } }>();
    const user = request.user;

    // If req.user is missing, allow execution to proceed to AuthGuard('jwt') for 401 handling
    if (!user) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.roleId as MasterRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: requires role(s) [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
