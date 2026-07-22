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
      return this.utilService.sendSuccessResponse(res, 'Permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Get('me')
  async getMyPermissions(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info('Method start: getMyPermissions');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const permissions = await this.permissionsService.findByRole(user.currentRoleId);
      return this.utilService.sendSuccessResponse(res, 'My permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching my permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
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
      return this.utilService.sendSuccessResponse(res, 'Permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching role permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
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
    logger.info('Method start: create permission');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const perm = await this.permissionsService.create(dto, user.userId);
      return this.utilService.sendSuccessResponse(res, 'Permission created', perm);
    } catch (error) {
      logger.error(`Error creating permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
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
      return this.utilService.sendSuccessResponse(res, 'Permission updated', perm);
    } catch (error) {
      logger.error(`Error updating permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
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
      return this.utilService.sendSuccessResponse(res, 'Permission deleted');
    } catch (error) {
      logger.error(`Error deleting permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
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
    logger.info(`Method start: assign permissions to role #${roleId}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.permissionsService.assignToRole(roleId, dto, user.userId);
      return this.utilService.sendSuccessResponse(res, 'Permissions assigned to role');
    } catch (error) {
      logger.error(`Error assigning permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  /**
   * POST /permissions/check
   * Evaluates a single permission for the calling user.
   * Useful for frontend dynamic gating without fetching the full ability.
   *
   * Body: { action: 'read', subject: 'users:profile' }
   * Response: { allowed: true }
   */
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
      return this.utilService.sendSuccessResponse(res, 'Permission checked', { allowed });
    } catch (error) {
      logger.error(`Error checking permission: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  /**
   * GET /permissions/effective
   * Returns the full structured permission list for the calling user's active role.
   * Includes role metadata and per-permission details (module, resource, action, scope).
   * Useful for admin UIs, debugging, and developer tooling.
   */
  @Get('effective')
  async getEffectivePermissions(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info('Method start: getEffectivePermissions');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const data = await this.permissionsService.getEffectivePermissions(user);
      return this.utilService.sendSuccessResponse(res, 'Effective permissions fetched', data);
    } catch (error) {
      logger.error(`Error fetching effective permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  /**
   * GET /permissions/cache/metrics
   * Returns permission cache statistics: hits, misses, invalidations, hitRate.
   * Restricted to users with permission management access.
   * Invaluable for diagnosing authorization performance in production.
   */
  @Get('cache/metrics')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'permissions:permissions'])
  async getCacheMetrics(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(PermissionsController.name, req);
    logger.info('Method start: getCacheMetrics');
    try {
      const metrics = this.permissionCache.getMetrics();
      return this.utilService.sendSuccessResponse(res, 'Cache metrics fetched', metrics);
    } catch (error) {
      logger.error(`Error fetching cache metrics: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }
}
