import { PermissionGuard } from './permission.guard';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability-factory/casl-ability.factory';
import { AuthService } from 'src/auth/auth/auth.service';

describe('PermissionGuard', () => {
  it('should be defined', () => {
    expect(
      new PermissionGuard(
        new Reflector(),
        new CaslAbilityFactory({} as unknown as AuthService),
      ),
    ).toBeDefined();
  });
});
