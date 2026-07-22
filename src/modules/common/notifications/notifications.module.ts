import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NotificationHistory,
  Notifications,
} from 'src/entities/notification.entity';
import { UtilService } from 'src/utility/util/util.service';
import { EmailService } from 'src/utility/email/email.service';
import { NotificationGateway } from './notification.gateway';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notifications, NotificationHistory]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '5h' },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    UtilService,
    EmailService,
    NotificationGateway,
  ],
})
export class NotificationsModule {}
