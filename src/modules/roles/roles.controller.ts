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
      logger.info(`Successfully fetched ${roles.length} roles`);
      return this.utilService.sendSuccessResponse(res, 'Roles fetched successfully', roles);
    } catch (error) {
      logger.error(`Error fetching roles: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: findAll roles');
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
    logger.info(`Method start: create role key=${dto.roleKey}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const role = await this.rolesService.create(dto, user.userId);
      logger.info(`Successfully created role #${role.id} (${role.roleKey})`);
      return this.utilService.sendSuccessResponse(res, 'Role created successfully', role);
    } catch (error) {
      logger.error(`Error creating role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: create role');
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
      logger.info(`Successfully updated role #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Role updated successfully', role);
    } catch (error) {
      logger.error(`Error updating role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: update role #${id}`);
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
      logger.info(`Successfully soft-deleted role #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Role deleted successfully');
    } catch (error) {
      logger.error(`Error deleting role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: remove role #${id}`);
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
    logger.info(`Method start: assign role #${dto.roleId} to user #${dto.userId}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const userRole = await this.rolesService.assignRole(dto, user.userId);
      logger.info(`Successfully assigned role #${dto.roleId} to user #${dto.userId}`);
      return this.utilService.sendSuccessResponse(res, 'Role assigned successfully', userRole);
    } catch (error) {
      logger.error(`Error assigning role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: assign role`);
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
    logger.info(`Method start: remove user role #${roleId} from user #${userId}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.rolesService.removeRole(userId, roleId, user.userId);
      logger.info(`Successfully removed role #${roleId} from user #${userId}`);
      return this.utilService.sendSuccessResponse(res, 'Role removed from user');
    } catch (error) {
      logger.error(`Error removing user role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: remove user role`);
    }
  }

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

      if (!user.roleIds?.includes(dto.roleId)) {
        logger.error(`User #${user.userId} attempted unauthorized switch to role #${dto.roleId}`);
        return this.utilService.sendErrorResponse(
          res,
          'You are not assigned to this role',
        );
      }

      const userRoles = await this.authService.getUserRoles(user.userId);
      const switchedRole = userRoles.find((r) => r.roleId === dto.roleId);
      if (!switchedRole) {
        logger.error(`Role #${dto.roleId} not found for user #${user.userId}`);
        return this.utilService.sendErrorResponse(res, 'Role not found for this user');
      }

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
    } finally {
      logger.info(`Method end: switch role`);
    }
  }

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
      logger.info(`Successfully fetched ${permissions.length} permissions for role #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Role permissions fetched', permissions);
    } catch (error) {
      logger.error(`Error fetching role permissions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: getRolePermissions for role #${id}`);
    }
  }

  @Get(':id/users')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'roles:roles'])
  async getRoleUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(RolesController.name, req);
    logger.info(`Method start: getRoleUsers for role #${id}`);
    try {
      const users = await this.rolesService.getRoleUsers(id);
      logger.info(`Successfully fetched ${users.length} users for role #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Role users fetched', users);
    } catch (error) {
      logger.error(`Error fetching role users: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: getRoleUsers for role #${id}`);
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
      logger.info(`Successfully fetched ${roles.length} roles for user #${userId}`);
      return this.utilService.sendSuccessResponse(res, 'User roles fetched', roles);
    } catch (error) {
      logger.error(`Error fetching user roles: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: getUserRoles for user #${userId}`);
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
      logger.info(`Successfully removed user #${userId} from role #${roleId}`);
      return this.utilService.sendSuccessResponse(res, 'User removed from role');
    } catch (error) {
      logger.error(`Error removing user from role: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: removeUserFromRole role #${roleId} user #${userId}`);
    }
  }
}
