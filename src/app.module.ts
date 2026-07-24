import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import jwtConfig from './config/jwtConfig';
import config from './config/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ThrottlerModule } from '@nestjs/throttler';
import { NotificationsModule } from './modules/common/notifications/notifications.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UsersModule } from './modules/users/users.module';
import { CaslPermissionModule } from './casl-permission/casl-permission.module';
import { MultiFactorAuthenticationService } from './utility/multi-factor-authentication/multi-factor-authentication.service';
import { UserDetails } from './entities/user.entity';
import { MasterRoles, MasterModule } from './entities/master.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { UserSession } from './entities/user-session.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SidebarItem } from './entities/sidebar-item.entity';
import { SidebarModule } from './modules/sidebar/sidebar.module';
import { MastersModule } from './modules/common/masters/masters.module';
import { join } from 'path';
import { LogUploadCronService } from './utility/log-upload-cron/log-upload-cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RequestSignatureModule } from './utility/request-signature/request-signature.module';
import { RequestSignatureMiddleware } from './utility/request-signature/request-signature.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      load: [config, jwtConfig],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      UserDetails,
      MasterRoles,
      MasterModule,
      Permission,
      RolePermission,
      UserRole,
      UserSession,
      AuditLog,
      SidebarItem,
    ]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
    WinstonModule.forRoot({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.colorize(),
        winston.format.errors(),
      ),
      transports: [
        new winston.transports.Console({
          level: 'info',
          format: winston.format.simple(),
        }),
        new winston.transports.DailyRotateFile({
          filename: 'CO2-%DATE%.log',
          level: 'info',
          dirname: process.env.LOG_PATH || 'logs',
          handleExceptions: true,
          json: false,
          zippedArchive: true,
          maxSize: '50m',
        }),
      ],
    }),
    MailerModule.forRoot({
      transport: {
        service: process.env.MAIL_SERVICE,
        host: process.env.MAIL_HOST,
        port: 2525,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: process.env.FROM_EMAIL,
      },
      preview: false,
      template: {
        dir: join(process.cwd(), 'src/utility/email/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: false,
        },
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    NotificationsModule,
    RegistrationModule,
    RolesModule,
    PermissionsModule,
    UsersModule,
    CaslPermissionModule,
    MastersModule,
    RequestSignatureModule,
    SidebarModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MultiFactorAuthenticationService,
    LogUploadCronService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestSignatureMiddleware).forRoutes('*');
  }
}
