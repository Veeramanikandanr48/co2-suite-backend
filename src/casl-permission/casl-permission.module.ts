import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from './casl-ability-factory/casl-ability.factory';
import { PermissionGuard } from './permission/permission.guard';
import { PermissionCacheService } from './permission-cache.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CaslAbilityFactory, PermissionGuard, PermissionCacheService],
  exports: [CaslAbilityFactory, PermissionGuard, PermissionCacheService],
})
export class CaslPermissionModule {}
