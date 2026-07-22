import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { MasterRoles } from 'src/entities/master.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { CaslPermissionModule } from 'src/casl-permission/casl-permission.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from 'src/auth/auth.module';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MasterRoles, UserRole, AuditLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    AuthModule,
    CaslPermissionModule,
    PermissionsModule,
  ],
  controllers: [RolesController],
  providers: [RolesService, UtilService],
  exports: [RolesService],
})
export class RolesModule {}
