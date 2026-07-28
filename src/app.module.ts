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
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      load: [config, jwtConfig],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MultiFactorAuthenticationService,
    LogUploadCronService,
  ],
})
export class AppModule {}
