import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ServicesService } from './services.service';
import { AssignServicesDto, CreateScopeItemDto, CreateServiceDto } from 'src/dto/service.dto';
import { CreateEmissionFactorDto, CreateInventoryEntryDto } from 'src/dto/inventory.dto';
import { UtilService } from 'src/utility/util/util.service';
import { MasterRole } from 'src/enums/casl.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@ApiTags('Services')
@Controller()
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly utilService: UtilService,
  ) {}

  @Get('services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available master services from DB' })
  async getAllServices(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getAllServices');
    try {
      const result = await this.servicesService.getAllServices();
      this.utilService.sendSuccessResponse(res, 'Successfully fetched services', result);
    } catch (error) {
      logger.error(`Error in getAllServices: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getAllServices');
      res.end();
    }
  }

  @Post('services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new master service in DB dynamically (Super Admin only)' })
  async createService(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateServiceDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: createService');
    try {
      const user = req['user'] as IDecodeUserDetails;
      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can create master services');
      }

      const result = await this.servicesService.createService(dto);
      this.utilService.sendSuccessResponse(res, 'Service created successfully in DB', result);
    } catch (error) {
      logger.error(`Error in createService: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: createService');
      res.end();
    }
  }

  @Get('services/:code/scopes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dynamic scope 1, 2, 3 service items from DB for a service module' })
  async getServiceScopes(
    @Req() req: Request,
    @Res() res: Response,
    @Param('code') code: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getServiceScopes');
    try {
      const result = await this.servicesService.getServiceScopes(code);
      this.utilService.sendSuccessResponse(res, 'Successfully fetched service scope items', result);
    } catch (error) {
      logger.error(`Error in getServiceScopes: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getServiceScopes');
      res.end();
    }
  }

  @Post('services/scopes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new Scope item to DB dynamically (Super Admin only)' })
  async createScopeItem(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateScopeItemDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: createScopeItem');
    try {
      const user = req['user'] as IDecodeUserDetails;
      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can create scope items');
      }

      const result = await this.servicesService.createScopeItem(dto);
      this.utilService.sendSuccessResponse(res, 'Scope item created successfully in DB', result);
    } catch (error) {
      logger.error(`Error in createScopeItem: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: createScopeItem');
      res.end();
    }
  }

  @Delete('services/scopes/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Scope item from DB dynamically (Super Admin only)' })
  async deleteScopeItem(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: deleteScopeItem');
    try {
      const user = req['user'] as IDecodeUserDetails;
      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can delete scope items');
      }

      const result = await this.servicesService.deleteScopeItem(Number(id));
      this.utilService.sendSuccessResponse(res, result.message, null);
    } catch (error) {
      logger.error(`Error in deleteScopeItem: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: deleteScopeItem');
      res.end();
    }
  }

  // --- EMISSION FACTORS ENDPOINTS ---

  @Get('emission-factors')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get emission factors and dropdown calculation parameters from DB' })
  async getEmissionFactors(
    @Req() req: Request,
    @Res() res: Response,
    @Query('category') category?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getEmissionFactors');
    try {
      const result = await this.servicesService.getEmissionFactors(category);
      this.utilService.sendSuccessResponse(res, 'Successfully fetched emission factors', result);
    } catch (error) {
      logger.error(`Error in getEmissionFactors: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getEmissionFactors');
      res.end();
    }
  }

  @Post('emission-factors')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new emission factor in DB dynamically' })
  async createEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateEmissionFactorDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: createEmissionFactor');
    try {
      const result = await this.servicesService.createEmissionFactor(dto);
      this.utilService.sendSuccessResponse(res, 'Emission factor created successfully', result);
    } catch (error) {
      logger.error(`Error in createEmissionFactor: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: createEmissionFactor');
      res.end();
    }
  }

  // --- INVENTORY ENTRIES ENDPOINTS ---

  @Get('inventory-entries')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inventory entries from DB for user organization' })
  async getInventoryEntries(
    @Req() req: Request,
    @Res() res: Response,
    @Query('category') category?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getInventoryEntries');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const orgId = user?.organizationId || 1;
      const result = await this.servicesService.getInventoryEntries(orgId, category);
      this.utilService.sendSuccessResponse(res, 'Successfully fetched inventory entries', result);
    } catch (error) {
      logger.error(`Error in getInventoryEntries: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getInventoryEntries');
      res.end();
    }
  }

  @Post('inventory-entries')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save new inventory entry to DB with formula calculation' })
  async createInventoryEntry(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateInventoryEntryDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: createInventoryEntry');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const orgId = user?.organizationId || 1;
      const userId = user?.id || 1;
      const result = await this.servicesService.createInventoryEntry(orgId, userId, dto);
      this.utilService.sendSuccessResponse(res, 'Inventory entry saved to database', result);
    } catch (error) {
      logger.error(`Error in createInventoryEntry: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: createInventoryEntry');
      res.end();
    }
  }

  @Delete('inventory-entries/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete inventory entry from DB' })
  async deleteInventoryEntry(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: deleteInventoryEntry');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const orgId = user?.organizationId || 1;
      const result = await this.servicesService.deleteInventoryEntry(orgId, Number(id));
      this.utilService.sendSuccessResponse(res, result.message, null);
    } catch (error) {
      logger.error(`Error in deleteInventoryEntry: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: deleteInventoryEntry');
      res.end();
    }
  }

  @Get('organizations/:id/services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get services subscribed by an organization' })
  async getOrgServices(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getOrgServices');
    try {
      const user = req['user'] as IDecodeUserDetails;

      const isSuperAdmin = user?.roleId === MasterRole.SUPER_ADMIN;
      const isSameOrg = Number(user?.organizationId) === Number(id);

      if (!isSuperAdmin && !isSameOrg) {
        throw new ForbiddenException('Access denied');
      }

      const result = await this.servicesService.getOrgServices(id);
      this.utilService.sendSuccessResponse(res, 'Successfully fetched organization services', result);
    } catch (error) {
      logger.error(`Error in getOrgServices: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getOrgServices');
      res.end();
    }
  }

  @Post('organizations/:id/services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign services to an organization (Super Admin only)' })
  async assignServices(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Body() dto: AssignServicesDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: assignServices');
    try {
      const user = req['user'] as IDecodeUserDetails;

      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can assign services to organizations');
      }

      const result = await this.servicesService.assignServices(id, dto, user.id);
      this.utilService.sendSuccessResponse(res, 'Services assigned successfully', result);
    } catch (error) {
      logger.error(`Error in assignServices: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: assignServices');
      res.end();
    }
  }

  @Delete('organizations/:id/services/:serviceId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a service from an organization (Super Admin only)' })
  async removeOrgService(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Param('serviceId') serviceId: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: removeOrgService');
    try {
      const user = req['user'] as IDecodeUserDetails;

      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can remove services from organizations');
      }

      const result = await this.servicesService.removeOrgService(id, serviceId);
      this.utilService.sendSuccessResponse(res, result.message, null);
    } catch (error) {
      logger.error(`Error in removeOrgService: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: removeOrgService');
      res.end();
    }
  }
}
