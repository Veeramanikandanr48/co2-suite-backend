import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { MongoAbility } from '@casl/ability';
import { Request } from 'express';
import {
  CaslAbilityFactory,
  PERMISSION_CHECKER_KEY,
  RequiredPermission,
} from '../casl-ability-factory/casl-ability.factory';
import {
  OWNERSHIP_RESOLVER_KEY,
} from '../ownership/ownership-resolver.decorator';
import { IOwnershipResolver } from '../ownership/ownership-resolver.interface';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { Type } from '@nestjs/common/interfaces';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.get<RequiredPermission[]>(
        PERMISSION_CHECKER_KEY,
        context.getHandler(),
      ) ?? [];

    // No permissions declared → route is publicly guarded by JwtAuthGuard only
    if (requiredPermissions.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req['user'] as IDecodeUserDetails;
    const ability = await this.abilityFactory.createForUser(user);

    // ── Step 1: Standard CASL permission check ────────────────────────────
    const allAllowed = requiredPermissions.every((permission) =>
      this.isAllowed(ability, permission),
    );

    if (!allAllowed) {
      this.logger.debug(
        `rbac.permission.denied userId=${user.userId} roleKey=${user.roleKey} permissions=${JSON.stringify(requiredPermissions)}`,
      );
      return false;
    }

    // ── Step 2: Ownership check (optional, via @OwnershipResolver) ────────
    const resolverClass = this.reflector.get<Type<IOwnershipResolver> | undefined>(
      OWNERSHIP_RESOLVER_KEY,
      context.getHandler(),
    );

    if (resolverClass) {
      let ownerId: number;
      try {
        // Resolve from DI container so the resolver can inject any service
        const resolver = await this.moduleRef.resolve<IOwnershipResolver>(
          resolverClass,
          undefined,
          { strict: false },
        );
        ownerId = await resolver.resolve(req);
      } catch (err) {
        this.logger.error(
          `rbac.ownership.resolver.error resolverClass=${resolverClass.name} error=${(err as Error).message}`,
        );
        throw new ForbiddenException('Ownership could not be verified');
      }

      if (ownerId !== user.userId) {
        this.logger.debug(
          `rbac.ownership.denied userId=${user.userId} resourceOwnerId=${ownerId}`,
        );
        return false;
      }

      this.logger.debug(
        `rbac.ownership.granted userId=${user.userId} resourceOwnerId=${ownerId}`,
      );
    }

    return true;
  }

  private isAllowed(
    ability: MongoAbility,
    permission: RequiredPermission,
  ): boolean {
    return ability.can(...permission);
  }
}
