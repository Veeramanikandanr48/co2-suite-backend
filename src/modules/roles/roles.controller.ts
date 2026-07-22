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
import { JwtService } from '@nestjs/jwt';
import { RolesService } from './roles.service';
import { AssignRoleDto, CreateRoleDto, SwitchRoleDto, UpdateRoleDto } from './dto/role.dto';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CheckPermissions } from 'src/casl-permission/casl-ability-factory/casl-ability.factory';
import { PermissionGuard } from 'src/casl-permission/permission/permission.guard';
import { Action } from 'src/enums/casl.enum';
import { PermissionsService } from '../permissions/permissions.service';
import { AuthService } from 'src/auth/auth/auth.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly utilService: UtilService,
    private readonly permissionsService: PermissionsService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'roles:roles'])
  async findAll(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info('Method start: findAll roles');
    try {
      const roles = await this.rolesService.findAll();
      return this.utilService.sendSuccessResponse(res, 'Roles fetched successfully', roles);
    } catch (error) {
      logger.error(`Error fetching roles: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Post()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.CREATE, 'roles:roles'])
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateRoleDto,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info('Method start: create role');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const role = await this.rolesService.create(dto, user.userId);
      return this.utilService.sendSuccessResponse(res, 'Role created successfully', role);
    } catch (error) {
      logger.error(`Error creating role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'roles:roles'])
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: update role #${id}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const role = await this.rolesService.update(id, dto, user.userId);
      return this.utilService.sendSuccessResponse(res, 'Role updated successfully', role);
    } catch (error) {
      logger.error(`Error updating role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.DELETE, 'roles:roles'])
  async remove(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: remove role #${id}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.rolesService.remove(id, user.userId);
      return this.utilService.sendSuccessResponse(res, 'Role deleted successfully');
    } catch (error) {
      logger.error(`Error deleting role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Post('assign')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'roles:roles'])
  async assignRole(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: AssignRoleDto,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: assign role`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const userRole = await this.rolesService.assignRole(dto, user.userId);
      return this.utilService.sendSuccessResponse(res, 'Role assigned successfully', userRole);
    } catch (error) {
      logger.error(`Error assigning role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Delete('user/:userId/role/:roleId')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'roles:roles'])
  async removeUserRole(
    @Req() req: Request,
    @Res() res: Response,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: remove user role`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.rolesService.removeRole(userId, roleId, user.userId);
      return this.utilService.sendSuccessResponse(res, 'Role removed from user');
    } catch (error) {
      logger.error(`Error removing user role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  /**
   * POST /roles/switch
   *
   * Validates the requested roleId is in the user's JWT roleIds,
   * then issues a new short-lived access token with:
   *   - currentRoleId  updated to the switched role
   *   - roleKey        updated to the switched role's key
   *   - permissionsVersion from the DB (ensures fresh cache key)
   *
   * Returns { accessToken, currentRole, permissions } so the frontend
   * can update its state atomically without a separate refreshPermissions() call.
   */
  @Post('switch')
  async switchRole(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: SwitchRoleDto,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: switch role to #${dto.roleId}`);
    try {
      const user = req['user'] as IDecodeUserDetails;

      // 1. Validate the user is actually assigned to the requested role
      if (!user.roleIds?.includes(dto.roleId)) {
        return this.utilService.sendErrorResponse(
          res,
          'You are not assigned to this role',
        );
      }

      // 2. Fetch all role details (including fresh permissionsVersion from DB)
      const userRoles = await this.authService.getUserRoles(user.userId);
      const switchedRole = userRoles.find((r) => r.roleId === dto.roleId);
      if (!switchedRole) {
        return this.utilService.sendErrorResponse(res, 'Role not found for this user');
      }

      // 3. Issue a new JWT with updated role context
      const newPayload: Omit<IDecodeUserDetails, 'iat' | 'exp'> = {
        userId: user.userId,
        email: user.email,
        roleKey: switchedRole.roleKey,
        roleIds: user.roleIds,
        currentRoleId: switchedRole.roleId,
        tenantId: user.tenantId,
        permissionsVersion: switchedRole.permissionsVersion ?? 1,
      };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });

      // 4. Fetch fresh permissions for the switched role
      const permissions = await this.authService.getAllUserPermission(switchedRole.roleId);

      logger.info(`rbac.role.switched userId=${user.userId} from=${user.currentRoleId} to=${dto.roleId}`);

      return this.utilService.sendSuccessResponse(res, 'Role switched successfully', {
        accessToken,
        currentRole: {
          id: switchedRole.roleId,
          key: switchedRole.roleKey,
          name: switchedRole.roleName,
        },
        permissions,
      });
    } catch (error) {
      logger.error(`Error switching role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  // ─── Additional Endpoints ─────────────────────────────────────────────────

  @Get(':id/permissions')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'permissions:permissions'])
  async getRolePermissions(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: getRolePermissions for role #${id}`);
    try {
      const permissions = await this.permissionsService.findByRole(id);
      return this.utilService.sendSuccessResponse(res, 'Role permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching role permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Get('users/:userId/roles')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'roles:roles'])
  async getUserRoles(
    @Req() req: Request,
    @Res() res: Response,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: getUserRoles for user #${userId}`);
    try {
      const roles = await this.rolesService.getUserRoles(userId);
      return this.utilService.sendSuccessResponse(res, 'User roles fetched', roles);
    } catch (error) {
      logger.error(`Error fetching user roles: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Delete(':roleId/users/:userId')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'roles:roles'])
  async removeUserFromRole(
    @Req() req: Request,
    @Res() res: Response,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: removeUserFromRole role #${roleId} user #${userId}`);
    try {
      const changedBy = (req['user'] as IDecodeUserDetails).userId;
      await this.rolesService.removeRole(userId, roleId, changedBy);
      return this.utilService.sendSuccessResponse(res, 'User removed from role');
    } catch (error) {
      logger.error(`Error removing user from role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }
}
