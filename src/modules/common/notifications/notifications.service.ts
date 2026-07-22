import { Injectable } from '@nestjs/common';
import {
  NotificationHistory,
  Notifications,
} from 'src/entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnableNotificationDto } from './dto/create-notification.dto';
import { DeviceTypes, NotificationType } from 'src/enums/notification.enum';
import { INotificationPayload } from 'src/interfaces/notification.interface';
import { NotificationGateway } from './notification.gateway';
import { getMessaging } from 'firebase-admin/messaging';
// import { ServiceAccount } from 'firebase-admin';

@Injectable()
export class NotificationsService {
  constructor(
    private notificationGateway: NotificationGateway,
    @InjectRepository(Notifications)
    private readonly notificationRepository: Repository<Notifications>,
    @InjectRepository(NotificationHistory)
    private readonly notificationHistoryRepository: Repository<NotificationHistory>,
  ) {
    // const serviceAccount: firebase.ServiceAccount = require('../../../../firebase-admin-private-key.json');
    // firebase.initializeApp({
    //   credential: firebase.credential.cert(serviceAccount),
    // });
  }

  async saveNotification(data: Partial<Notifications> | EnableNotificationDto) {
    return await this.notificationRepository.save(data);
  }

  async updateNotification(data: Notifications, userId: number) {
    return await this.notificationRepository.update({ userId }, data);
  }

  async saveNotificationHistory(
    data: NotificationHistory | INotificationPayload,
  ) {
    return await this.notificationHistoryRepository.save(data);
  }

  async getNotificationHistory(userId: number): Promise<NotificationHistory[]> {
    return await this.notificationHistoryRepository
      .createQueryBuilder('nh')
      .where('nh.userId = :userId and nh.isActive = true', { userId })
      .select(
        `nh.title, nh.body, nh.userId, nh.createdOn, nh.id, nh.userNotificationId, nh.isRead`,
      )
      .orderBy('nh.id', 'DESC')
      .limit(100)
      .getRawMany();
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return await this.notificationHistoryRepository
      .createQueryBuilder('nh')
      .where(
        'nh.userId = :userId and nh.isRead = false and nh.isActive = true',
        { userId },
      )
      .getCount();
  }

  async getNotificationByUserIdWithDeviceType(
    userId: number,
    deviceType: DeviceTypes,
  ): Promise<Notifications[]> {
    return await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.deviceType = :deviceType', { deviceType })
      .andWhere('notification.isActive = true')
      .getMany();
  }

  async getNotificationByUserId(userId: number): Promise<Notifications[]> {
    return await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.userId = :userId and n.isActive = true', { userId })
      .orderBy('n.id', 'DESC')
      .select(['n.token', 'n.deviceType', 'n.userId', 'n.id'])
      .getRawMany();
  }

  async getNotificationDetailByUserId(
    userId: number,
  ): Promise<Notifications[]> {
    return await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.userId = :userId and n.isActive = true', { userId })
      .select(
        'n.token, n.deviceType, n.userId, n.id, n.enablePushNotification, n.enableInAppNotification',
      )
      .getRawMany();
  }

  async sendPushNotification(data: INotificationPayload) {
    try {
      const userNotificationData = await this.getNotificationByUserId(
        data.userId,
      );
      if (!userNotificationData.length) {
        return {
          status: false,
          message: 'User notification not found',
        };
      }
      data.userNotificationId = userNotificationData[0].id;
      data.createdBy = data.userId;
      data.userId = data.userId;
      const notification = await this.saveNotificationHistory(data);

      // const deviceTokens = userNotificationData.map((item) => item.token);
      // getMessaging().sendEachForMulticast({
      //   notification: {
      //     title: data.title,
      //     body: data.body,
      //   },
      //   tokens: deviceTokens,
      // })
      //   .catch((error: any) => {
      //     console.error(error);
      //     return {
      //       status: false,
      //       message: error.message,
      //       error,
      //     }
      //   });
      return {
        status: true,
        message: 'Notification sent successfully',
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async sendNotification(data: INotificationPayload) {
    const notificationStatus = false;
    let notification = null;
    const userNotificationData = await this.getNotificationDetailByUserId(
      data.userId,
    );
    if (!userNotificationData) {
      return { notificationStatus, notification };
    }
    notification = await this.saveNotificationHistory(data);
    // Format createdOn time before sending notification
    const formattedNotification = {
      ...notification,
      createdOn: notification.createdOn
        ? new Date(notification.createdOn).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
        : null,
    };
    this.notificationGateway.sendNotificationToUser(
      data.userId,
      formattedNotification,
    );

    const deviceTokens = [];
    userNotificationData.forEach((item) => {
      if (item.enablePushNotification) {
        deviceTokens.push(item.token);
      }
    });

    await getMessaging()
      .sendEachForMulticast({
        notification: {
          title: data.title,
          body: data.body,
        },
        tokens: deviceTokens,
      })
      .catch((error: unknown) => {
        return error;
      });
    return notification;
  }

  async markAsRead(id: number, userId: number) {
    await this.notificationHistoryRepository.update(
      { id, userId },
      { isRead: true },
    );
  }

  async deleteNotification(id: number, userId: number) {
    await this.notificationHistoryRepository.update(
      { id, userId },
      { isActive: false },
    );
  }
}
