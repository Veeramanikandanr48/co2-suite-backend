import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SidebarItem } from 'src/entities/sidebar-item.entity';
import { MasterModule } from 'src/entities/master.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { SidebarService } from './sidebar.service';
import { SidebarController } from './sidebar.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UtilService } from 'src/utility/util/util.service';
import { CaslPermissionModule } from 'src/casl-permission/casl-permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SidebarItem, MasterModule, AuditLog]),
    AuthModule,
    CaslPermissionModule,
  ],
  controllers: [SidebarController],
  providers: [SidebarService, UtilService],
  exports: [SidebarService],
})
export class SidebarModule {}
