import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Put,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get notification history for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Notification history fetched successfully',
  })
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
      logger.info(`Method started: getNotificationHistoryByUserId`);
      const notificationHistory =
        await this.notificationsService.getNotificationHistory(userId);
      const unreadNotificationCount =
        await this.notificationsService.getUnreadNotificationCount(userId);
      logger.info(`Operation successful`);
      this.utilService.sendSuccessResponse(
        res,
        'Notification history fetched successfully',
        {
          notificationHistory,
          unreadNotificationCount,
        },
      );
    } catch (error) {
      logger.error(`Error occurred`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error in fetching notification history',
      );
    } finally {
      logger.info(`Method ended: getNotificationHistoryByUserId`);
    }
  }

  @Post('toggleNotification')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enable or disable push notification for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preference updated successfully',
  })
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
      logger.info(`Method started: enableNotification`);
      const message = await this.notificationsService.toggleNotification(
        data,
        userId,
      );
      logger.info(`Operation successful`);
      this.utilService.sendSuccessResponse(res, message);
    } catch (error) {
      logger.error(`Error occurred`, error);
      return this.utilService.sendErrorResponse(
        res,
        'Error in enabling notification',
      );
    } finally {
      logger.info(`Method ended: enableNotification`);
    }
  }

  @Post('sendNotification')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a push notification to the current user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
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
      logger.info(`Method started: sendNotification`);
      const notificationData: INotificationPayload = {
        title: data.title,
        body: data.body,
        userId,
      };
      const notificationResponse =
        await this.notificationsService.sendNotification(notificationData);
      logger.info(`Operation successful`);
      this.utilService.sendSuccessResponse(
        res,
        'Notification sent successfully',
        notificationResponse,
      );
    } catch (error) {
      logger.error(`Error occurred`, error);
      this.utilService.sendErrorResponse(res, 'Error in sending notification');
    } finally {
      logger.info(`Method ended: sendNotification`);
    }
  }

  @Put('read/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
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
      logger.info(`Method started: markAsRead`);
      await this.notificationsService.markAsRead(id, userId);
      logger.info(`Operation successful`);
      this.utilService.sendSuccessResponse(res, 'Notification marked as read');
    } catch (error) {
      logger.error(`Error occurred`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error in marking notification as read',
      );
    } finally {
      logger.info(`Method ended: markAsRead`);
    }
  }

  @Post('deleteNotification/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deactivated successfully',
  })
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
      logger.info(`Method started: deleteNotification`);
      await this.notificationsService.deleteNotification(id, userId);
      logger.info(`Operation successful`);
      this.utilService.sendSuccessResponse(
        res,
        'Notification deactivated successfully',
      );
    } catch (error) {
      logger.error(`Error occurred`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error in deactivating notification',
      );
    } finally {
      logger.info(`Method ended: deleteNotification`);
    }
  }
}
