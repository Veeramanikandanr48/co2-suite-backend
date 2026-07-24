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
import { SidebarService } from './sidebar.service';
import {
  CreateSidebarItemDto,
  PreviewNavigationDto,
  ReorderSidebarItemsDto,
  UpdateSidebarItemDto,
} from './dto/sidebar.dto';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CheckPermissions } from 'src/casl-permission/casl-ability-factory/casl-ability.factory';
import { PermissionGuard } from 'src/casl-permission/permission/permission.guard';
import { Action } from 'src/enums/casl.enum';

@ApiTags('sidebar')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('sidebar')
export class SidebarController {
  constructor(
    private readonly sidebarService: SidebarService,
    private readonly utilService: UtilService,
  ) {}

  @Get('my-menu')
  async getMyMenu(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info('Method start: getMyMenu');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const menu = await this.sidebarService.getUserMenu(user);
      logger.info(`Successfully fetched ${menu.length} root navigation items for user #${user.userId}`);
      return this.utilService.sendSuccessResponse(res, 'User dynamic navigation tree fetched successfully', menu);
    } catch (error) {
      logger.error(`Error fetching user menu: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getMyMenu');
    }
  }

  @Get('version')
  async getGlobalVersion(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info('Method start: getGlobalVersion');
    try {
      const version = await this.sidebarService.getGlobalVersion();
      return this.utilService.sendSuccessResponse(res, 'Global sidebar version fetched successfully', { version });
    } catch (error) {
      logger.error(`Error fetching global version: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getGlobalVersion');
    }
  }

  @Post('preview')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'settings:settings'])
  async previewForRole(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: PreviewNavigationDto,
  ) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info(`Method start: previewForRole roleKey=${dto.roleKey}`);
    try {
      const menu = await this.sidebarService.previewForRole(dto.roleKey);
      logger.info(`Successfully generated preview for role '${dto.roleKey}'`);
      return this.utilService.sendSuccessResponse(res, `Sidebar preview for role '${dto.roleKey}'`, menu);
    } catch (error) {
      logger.error(`Error generating preview for role '${dto.roleKey}': ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: previewForRole');
    }
  }

  @Get()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'settings:settings'])
  async findAll(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info('Method start: findAll sidebar items');
    try {
      const items = await this.sidebarService.findAll();
      logger.info(`Successfully fetched ${items.length} sidebar items`);
      return this.utilService.sendSuccessResponse(res, 'Sidebar items fetched successfully', items);
    } catch (error) {
      logger.error(`Error fetching sidebar items: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: findAll sidebar items');
    }
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'settings:settings'])
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info(`Method start: findOne sidebar item #${id}`);
    try {
      const item = await this.sidebarService.findOne(id);
      logger.info(`Successfully fetched sidebar item #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Sidebar item fetched successfully', item);
    } catch (error) {
      logger.error(`Error fetching sidebar item: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: findOne sidebar item #${id}`);
    }
  }

  @Post()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'settings:settings'])
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateSidebarItemDto,
  ) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info(`Method start: create sidebar item key=${dto.itemKey}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const item = await this.sidebarService.create(dto, user.userId);
      logger.info(`Successfully created sidebar item #${item.id} (${item.itemKey})`);
      return this.utilService.sendSuccessResponse(res, 'Sidebar item created successfully', item);
    } catch (error) {
      logger.error(`Error creating sidebar item: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: create sidebar item');
    }
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'settings:settings'])
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSidebarItemDto,
  ) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info(`Method start: update sidebar item #${id}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      const item = await this.sidebarService.update(id, dto, user.userId);
      logger.info(`Successfully updated sidebar item #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Sidebar item updated successfully', item);
    } catch (error) {
      logger.error(`Error updating sidebar item: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: update sidebar item #${id}`);
    }
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'settings:settings'])
  async remove(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info(`Method start: remove sidebar item #${id}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.sidebarService.remove(id, user.userId);
      logger.info(`Successfully soft-deleted sidebar item #${id}`);
      return this.utilService.sendSuccessResponse(res, 'Sidebar item deleted successfully');
    } catch (error) {
      logger.error(`Error deleting sidebar item: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: remove sidebar item #${id}`);
    }
  }

  @Post('reorder')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'settings:settings'])
  async reorder(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: ReorderSidebarItemsDto,
  ) {
    const logger = this.utilService.createLogger(SidebarController.name, req);
    logger.info(`Method start: reorder sidebar items count=${dto.items?.length}`);
    try {
      const user = req['user'] as IDecodeUserDetails;
      await this.sidebarService.reorder(dto, user.userId);
      logger.info('Successfully reordered sidebar items');
      return this.utilService.sendSuccessResponse(res, 'Sidebar items reordered successfully');
    } catch (error) {
      logger.error(`Error reordering sidebar items: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: reorder sidebar items');
    }
  }
}
