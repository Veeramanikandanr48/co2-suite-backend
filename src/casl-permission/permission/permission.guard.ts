import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CaslAbilityFactory,
  PERMISSION_CHECKER_KEY,
  RequiredPermission,
} from '../casl-ability-factory/casl-ability.factory';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { MongoAbility } from '@casl/ability';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: CaslAbilityFactory,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.get<RequiredPermission[]>(
        PERMISSION_CHECKER_KEY,
        context.getHandler(),
      ) || [];

    const req = context.switchToHttp().getRequest<Request>();
    const user = req['user'] as IDecodeUserDetails;
    const ability = await this.abilityFactory.createForUser(user);

    return requiredPermissions.every((permission) =>
      this.isAllowed(ability, permission),
    );
  }

  private isAllowed(
    ability: MongoAbility,
    permission: RequiredPermission,
  ): boolean {
    return ability.can(...permission);
  }
}
