import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UtilService } from 'src/utility/util/util.service';
import {
  EnableNotificationDto,
  SendNotificationDto,
} from './dto/create-notification.dto';
import { INotificationPayload } from 'src/interfaces/notification.interface';
import { ServiceAccount, initializeApp, cert } from 'firebase-admin/app';
import * as path from 'path';
import * as fs from 'fs';
import { UserId } from 'src/utility/decorators/userid.decorator';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly utilService: UtilService,
  ) {
    const serviceAccountPath = path.join(
      __dirname,
      '../../../../firebase-admin-private-key.json',
    );
    const serviceAccount: ServiceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8'),
    );
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  @Get('getNotificationHistoryByUserId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getNotificationHistoryByUserId(
    @Req() req: Request,
    @Res() res: Response,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      NotificationsController.name,
      req,
    );
    try {
      logger.info(`Method Start: getNotificationHistoryByUserId`);
      const notificationHistory =
        await this.notificationsService.getNotificationHistory(userId);
      const unreadNotificationCount =
        await this.notificationsService.getUnreadNotificationCount(userId);
      logger.info(`Successfully fetched notification history`);

      const notificationHistoryWithIST = notificationHistory.map(
        (notification) => {
          return {
            ...notification,
            createdOn: notification.createdOn
              ? new Date(notification.createdOn).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : null,
          };
        },
      );

      logger.info(`Method End: getNotificationHistoryByUserId`);
      this.utilService.sendSuccessResponse(
        res,
        'Notification history fetched successfully',
        {
          notificationHistory: notificationHistoryWithIST,
          unreadNotificationCount,
        },
      );
    } catch (error) {
      logger.error(`Error in fetching notification history`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error in fetching notification history',
      );
    } finally {
      logger.info(`Method End: getNotificationHistoryByUserId`);
    }
  }

  @Post('toggleNotification')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async enableNotification(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: EnableNotificationDto,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      NotificationsController.name,
      req,
    );
    try {
      logger.info(`Method Start: enableNotification`);
      const userNotificationData =
        await this.notificationsService.getNotificationByUserIdWithDeviceType(
          userId,
          data.deviceType,
        );
      logger.info(`Successfully fetched notification by userId`);

      if (userNotificationData.length && data.isActivate) {
        for (const notification of userNotificationData) {
          if (!notification.token) {
            notification.token = data.token;
            notification.deviceType = data.deviceType;
            notification.enablePushNotification = true;
            notification.isActive = true;
            await this.notificationsService.updateNotification(
              notification,
              userId,
            );
          } else if (notification.token && notification.token === data.token) {
            logger.info(`Notification already exists`);
            return this.utilService.sendSuccessResponse(
              res,
              'Notification already enabled',
            );
          }
        }
        logger.info(`Successfully updated notification token.`);
        return this.utilService.sendSuccessResponse(
          res,
          'Notification updated successfully',
        );
      }

      if (!data.isActivate) {
        for (const notification of userNotificationData) {
          notification.enablePushNotification = false;
          notification.isActive = false;
          await this.notificationsService.updateNotification(
            notification,
            userId,
          );
        }
        logger.info(`Successfully disabled previous device notification`);
        return this.utilService.sendSuccessResponse(
          res,
          'Notification disabled successfully',
        );
      }

      data['enablePushNotification'] = true;
      data['userId'] = userId;
      data['createdBy'] = userId;
      data['updatedBy'] = userId;
      const notification =
        await this.notificationsService.saveNotification(data);
      logger.info(`Successfully enabled notification`);
      return this.utilService.sendSuccessResponse(
        res,
        'Notification enabled successfully',
      );
    } catch (error) {
      logger.error(`Error in enabling notification`, error);
      return this.utilService.sendErrorResponse(
        res,
        'Error in enabling notification',
      );
    }
  }

  @Post('sendNotification')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async sendNotification(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: SendNotificationDto,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      NotificationsController.name,
      req,
    );
    try {
      logger.info(`Method Start: sendNotification`);
      // Send notification logic
      const notificationData: INotificationPayload = {
        title: data.title,
        body: data.body,
        userId,
      };
      // const notificationResponse = await this.notificationsService.sendPushNotification(notificationData);
      const notificationResponse =
        await this.notificationsService.sendNotification(notificationData);
      logger.info(`Successfully sent notification`);

      logger.info(`Method End: sendNotification`);
      this.utilService.sendSuccessResponse(
        res,
        'Notification sent successfully',
        notificationResponse,
      );
    } catch (error) {
      logger.error(`Error in sending notification`, error);
      this.utilService.sendErrorResponse(res, 'Error in sending notification');
    } finally {
      logger.info(`Method End: sendNotification`);
    }
  }

  @Put('read/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async markAsRead(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      NotificationsController.name,
      req,
    );
    try {
      logger.info(`Method Start: markAsRead`);
      await this.notificationsService.markAsRead(id, userId);
      logger.info(`Successfully marked notification as read`);
      this.utilService.sendSuccessResponse(res, 'Notification marked as read');
    } catch (error) {
      logger.error(`Error in marking notification as read`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error in marking notification as read',
      );
    } finally {
      logger.info(`Method End: markAsRead`);
    }
  }

  @Delete('deleteNotification/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async deleteNotification(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      NotificationsController.name,
      req,
    );
    try {
      logger.info(`Method Start: deleteNotification`);
      await this.notificationsService.deleteNotification(id, userId);
      logger.info(`Notification deleted successfully`);
      this.utilService.sendSuccessResponse(
        res,
        'Notification deleted successfully',
      );
    } catch (error) {
      logger.error(`Error in deleting notification`, error);
      this.utilService.sendErrorResponse(res, 'Error in deleting notification');
    } finally {
      logger.info(`Method End: deleteNotification`);
    }
  }
}
