import { createMongoAbility, MongoAbility, RawRule } from '@casl/ability';
import { Injectable, CustomDecorator, SetMetadata } from '@nestjs/common';
import { AuthService } from 'src/auth/auth/auth.service';
import { Action } from 'src/enums/casl.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { PermissionCacheService } from '../permission-cache.service';

export type AppAbility = MongoAbility<[Action, string]>;
export type RequiredPermission = [Action, string];

export const PERMISSION_CHECKER_KEY = 'permission_checker_params_key';

export const CheckPermissions = (
  ...params: RequiredPermission[]
): CustomDecorator<string> => SetMetadata(PERMISSION_CHECKER_KEY, params);

@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionCache: PermissionCacheService,
  ) {}

  /**
   * Builds a MongoAbility for the current request user.
   *
   * Cache-first strategy:
   *   1. Check PermissionCacheService (memory / Redis)
   *   2. On miss: query DB via AuthService
   *   3. Store in cache keyed by (roleId, permissionsVersion)
   *
   * The permissionsVersion in the JWT ensures stale cache entries
   * are never used after a role's permissions are updated.
   */
  async createForUser(user: IDecodeUserDetails): Promise<AppAbility> {
    if (user.roleKey === 'SUPER_ADMIN') {
      return createMongoAbility([
        { action: Action.MANAGE, subject: 'all' },
      ]) as AppAbility;
    }

    const roleId = user.currentRoleId ?? user.roleIds?.[0];
    const version = user.permissionsVersion ?? 1;

    let permissions = await this.permissionCache.get(roleId, version);

    if (!permissions) {
      permissions = await this.authService.getAllUserPermission(roleId);
      await this.permissionCache.set(roleId, version, permissions);
    }

    const ability = createMongoAbility(
      permissions.map((p) => ({
        action: p.action,
        subject: p.subject,
        ...(p.conditions ? { conditions: p.conditions } : {}),
      })) as RawRule[],
    );

    return ability as AppAbility;
  }
}
