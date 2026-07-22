import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission } from 'src/entities/permission.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { MasterModule, MasterRoles } from 'src/entities/master.entity';
import { CaslPermissionModule } from 'src/casl-permission/casl-permission.module';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, RolePermission, AuditLog, MasterModule, MasterRoles]),
    CaslPermissionModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, UtilService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
