import { Injectable } from '@nestjs/common';
import { MasterRole, RoleActions, RoleFeatures } from 'src/enums/casl.enum';
import { RawRule } from '@casl/ability';

@Injectable()
export class AuthService {
  constructor() {}

  async getAllUserPermission(roleId: number): Promise<RawRule[]> {
    if (roleId === MasterRole.SUPER_ADMIN || roleId === MasterRole.ADMIN) {
      return [{ action: RoleActions.MANAGE, subject: 'all' }];
    }
    return [
      { action: RoleActions.READ, subject: RoleFeatures.PROFILE },
      { action: RoleActions.UPDATE, subject: RoleFeatures.PROFILE },
    ];
  }
}
