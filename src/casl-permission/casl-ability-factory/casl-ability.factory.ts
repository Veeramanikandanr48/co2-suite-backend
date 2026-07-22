import { createMongoAbility, MongoAbility, RawRule } from '@casl/ability';
import { Injectable, CustomDecorator, SetMetadata } from '@nestjs/common';
import { AuthService } from 'src/auth/auth/auth.service';
import { RoleActions, RoleFeatures } from 'src/enums/casl.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

export type AppAbility = MongoAbility<[RoleActions, RoleFeatures]>;
export type RequiredPermission = [RoleActions, RoleFeatures];

export const PERMISSION_CHECKER_KEY = 'permission_checker_params_key';
export const CheckPermissions = (
  ...params: RequiredPermission[]
): CustomDecorator<string> => SetMetadata(PERMISSION_CHECKER_KEY, params);

@Injectable()
export class CaslAbilityFactory {
  constructor(private authService: AuthService) {}

  async createForUser(user: IDecodeUserDetails): Promise<MongoAbility> {
    const dbPermissions = await this.authService.getAllUserPermission(
      user.roleId,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ability = createMongoAbility(dbPermissions as any);
    return ability;
  }
}
