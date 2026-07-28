import { Injectable } from '@nestjs/common';
import { MasterRole, RoleActions, RoleFeatures } from 'src/enums/casl.enum';

@Injectable()
export class AuthService {
  constructor() { }

  async getAllUserPermission(roleId: number): Promise<unknown[]> {
    if (roleId === MasterRole.SUPER_ADMIN || roleId === MasterRole.ADMIN) {
      return [
        { action: RoleActions.MANAGE, subject: 'all' },
      ];
    }
    return [
      { action: RoleActions.READ, subject: RoleFeatures.PROFILE },
      { action: RoleActions.UPDATE, subject: RoleFeatures.PROFILE },
    ];
  }
}
