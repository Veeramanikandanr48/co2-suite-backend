import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PermissionsService } from './permissions.service';
import {
  AssignPermissionsDto,
  CheckPermissionDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto/permission.dto';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CheckPermissions } from 'src/casl-permission/casl-ability-factory/casl-ability.factory';
import { PermissionGuard } from 'src/casl-permission/permission/permission.guard';
import { Action } from 'src/enums/casl.enum';
import { PermissionCacheService } from 'src/casl-permission/permission-cache.service';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly utilService: UtilService,
    private readonly permissionCache: PermissionCacheService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'permissions:permissions'])
  async findAll(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info('Method start: findAll permissions');
    try {
      const permissions = await this.permissionsService.findAll();
      logger.info(`Successfully fetched ${permissions.length} permissions`);
      return this.utilService.sendSuccessResponse(res, 'Permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: findAll permissions');
    }
  }

  @Get('me')
  async getMyPermissions(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info('Method start: getMyPermissions');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const permissions = await this.permissionsService.findByRole(user.currentRoleId);
      logger.info(`Successfully fetched ${permissions.length} permissions for active role #${user.currentRoleId}`);
      return this.utilService.sendSuccessResponse(res, 'My permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching my permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getMyPermissions');
    }
  }

  @Get('role/:roleId')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'permissions:permissions'])
  async findByRole(
    @Req() req: Request,
    @Res() res: Response,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info(`Method start: findByRole #${roleId}`);
    try {
      const permissions = await this.permissionsService.findByRole(roleId);
      logger.info(`Successfully fetched ${permissions.length} permissions for role #${roleId}`);
      return this.utilService.sendSuccessResponse(res, 'Permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching role permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: findByRole #${roleId}`);
    }
  }

  @Post()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.CREATE, 'permissions:permissions'])
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreatePermissionDto,
  ) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info(`Method start: create permission action=${dto.action} resource=${dto.resource}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const perm = await this.permissionsService.create(dto, user.userId);
      logger.info(`Successfully created permission #${perm.id}`);
      return this.utilService.sendSuccessResponse(res, 'Permission created', perm);
    } catch (error) {
      logger.error(`Error creating permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: create permission');
    }
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'permissions:permissions'])
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info(`Method start: update permission #${id}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const perm = await this.permissionsService.update(id, dto, user.userId);
      logger.info(`Successfully updated permission #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Permission updated', perm);
    } catch (error) {
      logger.error(`Error updating permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: update permission #${id}`);
    }
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.DELETE, 'permissions:permissions'])
  async remove(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info(`Method start: remove permission #${id}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.permissionsService.remove(id, user.userId);
      logger.info(`Successfully deleted permission #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Permission deleted');
    } catch (error) {
      logger.error(`Error deleting permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: remove permission #${id}`);
    }
  }

  @Put('role/:roleId')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'permissions:permissions'])
  async assignToRole(
    @Req() req: Request,
    @Res() res: Response,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info(`Method start: assign permissions to role #${roleId} count=${dto.permissionIds?.length}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.permissionsService.assignToRole(roleId, dto, user.userId);
      logger.info(`Successfully assigned ${dto.permissionIds?.length} permissions to role #${roleId}`);
      return this.utilService.sendSuccessResponse(res, 'Permissions assigned to role');
    } catch (error) {
      logger.error(`Error assigning permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: assign permissions to role #${roleId}`);
    }
  }

  @Post('check')
  async checkPermission(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CheckPermissionDto,
  ) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info(`Method start: checkPermission action=${dto.action} subject=${dto.subject}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const allowed = await this.permissionsService.check(user, dto);
      logger.info(`Permission check result action=${dto.action} subject=${dto.subject} allowed=${allowed}`);
      return this.utilService.sendSuccessResponse(res, 'Permission checked', { allowed });
    } catch (error) {
      logger.error(`Error checking permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: checkPermission`);
    }
  }

  @Get('effective')
  async getEffectivePermissions(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info('Method start: getEffectivePermissions');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const data = await this.permissionsService.getEffectivePermissions(user);
      logger.info(`Successfully fetched effective permissions for user #${user.userId}`);
      return this.utilService.sendSuccessResponse(res, 'Effective permissions fetched', data);
    } catch (error) {
      logger.error(`Error fetching effective permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getEffectivePermissions');
    }
  }

  @Get('cache/metrics')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'permissions:permissions'])
  async getCacheMetrics(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info('Method start: getCacheMetrics');
    try {
      const metrics = this.permissionCache.getMetrics();
      logger.info('Successfully fetched cache metrics');
      return this.utilService.sendSuccessResponse(res, 'Cache metrics fetched', metrics);
    } catch (error) {
      logger.error(`Error fetching cache metrics: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getCacheMetrics');
    }
  }
}
