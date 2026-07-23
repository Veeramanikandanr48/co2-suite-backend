import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UsersService } from './users.service';
import {
  CreateUserManagementDto,
  ResetUserPasswordDto,
  UpdateUserManagementDto,
  UserQueryDto,
} from './dto/user-management.dto';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CheckPermissions } from 'src/casl-permission/casl-ability-factory/casl-ability.factory';
import { PermissionGuard } from 'src/casl-permission/permission/permission.guard';
import { Action } from 'src/enums/casl.enum';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly utilService: UtilService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'users:users'])
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: UserQueryDto,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: findAll users page=${query.page} limit=${query.limit} status=${query.status}`);
    try {
      const result = await this.usersService.findAll(query);
      logger.info(`Successfully fetched ${result.items.length} users (total: ${result.total})`);
      return this.utilService.sendSuccessResponse(res, 'Users fetched successfully', result);
    } catch (error) {
      logger.error(`Error fetching users: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: findAll users');
    }
  }

  @Get('me/2fa')
  async getMy2FA(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info('Method start: getMy2FA');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const data = await this.usersService.get2FADetails(user.userId);
      logger.info(`Successfully fetched self 2FA details for user #${user.userId}`);
      return this.utilService.sendSuccessResponse(res, 'Fetched self 2FA details successfully', data);
    } catch (error) {
      logger.error(`Error in getMy2FA: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getMy2FA');
    }
  }

  @Put('me/2fa/toggle')
  async toggleMy2FA(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info('Method start: toggleMy2FA');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const data = await this.usersService.toggleMy2FA(user.userId);
      logger.info(`Successfully toggled self 2FA for user #${user.userId}`);
      return this.utilService.sendSuccessResponse(res, '2FA status updated successfully', data);
    } catch (error) {
      logger.error(`Error in toggleMy2FA: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: toggleMy2FA');
    }
  }

  @Post('me/2fa/verify')
  async verifyMy2FA(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { code: string; secretKey?: string },
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info('Method start: verifyMy2FA');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const data = await this.usersService.verifyMy2FA(user.userId, body.code, body.secretKey);
      logger.info(`Successfully verified self 2FA for user #${user.userId}`);
      return this.utilService.sendSuccessResponse(res, 'Two-factor authentication verified and enabled successfully!', data);
    } catch (error) {
      logger.error(`Error in verifyMy2FA: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: verifyMy2FA');
    }
  }

  @Post('me/2fa/disable')
  async disableMy2FA(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info('Method start: disableMy2FA');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const data = await this.usersService.disableMy2FA(user.userId);
      logger.info(`Successfully disabled self 2FA for user #${user.userId}`);
      return this.utilService.sendSuccessResponse(res, 'Two-factor authentication disabled successfully', data);
    } catch (error) {
      logger.error(`Error in disableMy2FA: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: disableMy2FA');
    }
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'users:users'])
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: findOne user #${id}`);
    try {
      const user = await this.usersService.findOne(id);
      logger.info(`Successfully fetched user #${id}`);
      return this.utilService.sendSuccessResponse(res, 'User details fetched', user);
    } catch (error) {
      logger.error(`Error fetching user #${id}: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: findOne user #${id}`);
    }
  }

  @Post()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.CREATE, 'users:users'])
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateUserManagementDto,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: create user email=${dto.email}`);
    try {
      const admin = req['user'] as IDecodeUserDetails;
      const user = await this.usersService.create(dto, admin.userId);
      logger.info(`Successfully created user #${user.userId} (${user.emailId})`);
      return this.utilService.sendSuccessResponse(res, 'User created successfully', user);
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: create user');
    }
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'users:users'])
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserManagementDto,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: update user #${id}`);
    try {
      const admin = req['user'] as IDecodeUserDetails;
      const user = await this.usersService.update(id, dto, admin.userId);
      logger.info(`Successfully updated user #${id}`);
      return this.utilService.sendSuccessResponse(res, 'User updated successfully', user);
    } catch (error) {
      logger.error(`Error updating user #${id}: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: update user #${id}`);
    }
  }

  @Put(':id/toggle-status')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'users:users'])
  async toggleStatus(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: toggleStatus user #${id}`);
    try {
      const admin = req['user'] as IDecodeUserDetails;
      const user = await this.usersService.toggleStatus(id, admin.userId);
      logger.info(`Successfully toggled status for user #${id} (isActive=${user.isActive})`);
      return this.utilService.sendSuccessResponse(res, `User status updated to ${user.isActive ? 'Active' : 'Inactive'}`, user);
    } catch (error) {
      logger.error(`Error toggling status for user #${id}: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: toggleStatus user #${id}`);
    }
  }

  @Post(':id/reset-password')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'users:users'])
  async resetPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetUserPasswordDto,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: resetPassword user #${id}`);
    try {
      const admin = req['user'] as IDecodeUserDetails;
      await this.usersService.resetPassword(id, dto, admin.userId);
      logger.info(`Successfully reset password for user #${id}`);
      return this.utilService.sendSuccessResponse(res, 'User password reset successfully');
    } catch (error) {
      logger.error(`Error resetting password for user #${id}: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: resetPassword user #${id}`);
    }
  }

  @Get(':id/2fa')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'users:users'])
  async get2FA(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: get2FA for user #${id}`);
    try {
      const data = await this.usersService.get2FADetails(id);
      logger.info(`Successfully fetched 2FA details for user #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Fetched 2FA details successfully', data);
    } catch (error) {
      logger.error(`Error fetching 2FA details for user #${id}: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: get2FA for user #${id}`);
    }
  }

  @Post(':id/disable-2fa')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'users:users'])
  async disableUser2FAByAdmin(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { adminTotpCode: string },
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: disableUser2FAByAdmin for user #${id}`);
    try {
      const admin = req['user'] as IDecodeUserDetails;
      const data = await this.usersService.disableUser2FAByAdmin(id, admin.userId, body.adminTotpCode);
      logger.info(`Successfully disabled 2FA for user #${id} by admin #${admin.userId}`);
      return this.utilService.sendSuccessResponse(res, data.message, data);
    } catch (error) {
      logger.error(`Error disabling 2FA for user #${id}: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: disableUser2FAByAdmin user #${id}`);
    }
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.DELETE, 'users:users'])
  async remove(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(UsersController.name, req);
    logger.info(`Method start: remove user #${id}`);
    try {
      const admin = req['user'] as IDecodeUserDetails;
      await this.usersService.remove(id, admin.userId);
      logger.info(`Successfully soft-deleted user #${id}`);
      return this.utilService.sendSuccessResponse(res, 'User deleted successfully');
    } catch (error) {
      logger.error(`Error deleting user #${id}: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: remove user #${id}`);
    }
  }
}
