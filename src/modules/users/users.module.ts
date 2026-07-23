import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserDetails, UserAuthenticationDetails, UserEmailVerification } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { MasterRoles } from 'src/entities/master.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { CaslPermissionModule } from 'src/casl-permission/casl-permission.module';
import { UtilService } from 'src/utility/util/util.service';
import { EmailService } from 'src/utility/email/email.service';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserDetails,
      UserRole,
      UserAuthenticationDetails,
      UserEmailVerification,
      MasterRoles,
      AuditLog,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    CaslPermissionModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UtilService,
    EmailService,
    MultiFactorAuthenticationService,
    JwtService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
