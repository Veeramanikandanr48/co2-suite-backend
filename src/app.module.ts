import { Module } from '@nestjs/common';
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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './modules/common/notifications/notifications.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { MultiFactorAuthenticationService } from './utility/multi-factor-authentication/multi-factor-authentication.service';
import { UserDetails } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { MastersModule } from './modules/common/masters/masters.module';
import { ServicesModule } from './modules/services/services.module';
import { join } from 'path';
import { LogUploadCronService } from './utility/log-upload-cron/log-upload-cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { ApprovalModule } from './modules/common/approval/approval.module';
import { DataQualityModule } from './modules/common/data-quality/data-quality.module';
import { AiModule } from './modules/common/ai/ai.module';
import { ReportingModule } from './modules/common/reporting/reporting.module';
import { AnalyticsModule } from './modules/common/analytics/analytics.module';
import { EnterpriseModule } from './modules/common/enterprise/enterprise.module';
import { UtilService } from './utility/util/util.service';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      load: [config, jwtConfig],
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    TypeOrmModule.forFeature([UserDetails, Organization]),
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
          filename: 'MES-%DATE%.log',
          level: 'info',
          dirname: process.env.LOG_PATH,
          handleExceptions: true,
          json: false,
          zippedArchive: true,
          maxSize: '50m',
          maxFiles: '14d',
        }),
      ],
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: process.env.MAIL_PORT === '465',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `No Reply <${process.env.MAIL_FROM}>`,
      },
      template: {
        dir: join(process.cwd(), 'src/utility/email/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: false,
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60, // 1 minute
        limit: 10, // 10 requests
      },
    ]),
    NotificationsModule,
    RegistrationModule,
    OrganizationsModule,
    MastersModule,
    ServicesModule,
    FacilitiesModule,
    ApprovalModule,
    DataQualityModule,
    AiModule,
    ReportingModule,
    AnalyticsModule,
    EnterpriseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UtilService,
    MultiFactorAuthenticationService,
    LogUploadCronService,
    // Rate limiting guard — applied first
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Role-based access guard — applied after JWT authentication
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
