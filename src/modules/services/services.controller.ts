import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ServicesService } from './services.service';
import { AssignServicesDto, CreateScopeItemDto, CreateServiceDto } from 'src/dto/service.dto';
import { CreateEmissionFactorDto, CreateInventoryEntryDto, UpdateEmissionFactorDto } from 'src/dto/inventory.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
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

  @Get('services/:code/summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overall carbon summary metrics, graphs, charts, and activities strictly from DB' })
  async getCarbonSummary(
    @Req() req: Request,
    @Res() res: Response,
    @Param('code') code: string,
    @Query('year') year?: string,
    @Query('facility') facility?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getCarbonSummary');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const orgId = user?.organizationId || 1;
      const result = await this.servicesService.getCarbonSummary(orgId, code, { year, facility });
      this.utilService.sendSuccessResponse(res, 'Successfully fetched carbon summary', result);
    } catch (error) {
      logger.error(`Error in getCarbonSummary: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getCarbonSummary');
      res.end();
    }
  }

  @Get('dashboard/summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get executive main dashboard overall summary metrics strictly from DB' })
  async getExecutiveDashboardSummary(
    @Req() req: Request,
    @Res() res: Response,
    @Query('year') year?: string,
    @Query('facility') facility?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getExecutiveDashboardSummary');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const roleId = user?.roleId || 3;
      const orgId = user?.organizationId || 1;
      const result = await this.servicesService.getExecutiveDashboardSummary(roleId, orgId, { year, facility });
      this.utilService.sendSuccessResponse(res, 'Successfully fetched executive dashboard summary', result);
    } catch (error) {
      logger.error(`Error in getExecutiveDashboardSummary: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getExecutiveDashboardSummary');
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
      const user = req['user'] as IDecodeUserDetails;
      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin is authorized to create emission factors');
      }

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

  @Post('emission-factors/filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter and paginate emission factors with search, sort, category' })
  async getEmissionFactorsFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getEmissionFactorsFilterList');
    try {
      const result = await this.servicesService.getEmissionFactorsFilterList(payload);
      this.utilService.sendSuccessResponse(res, 'Emission factors filter list fetched successfully', result);
    } catch (error) {
      logger.error(`Error in getEmissionFactorsFilterList: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getEmissionFactorsFilterList');
      res.end();
    }
  }

  @Put('emission-factors/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing emission factor' })
  async updateEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() dto: UpdateEmissionFactorDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: updateEmissionFactor');
    try {
      const user = req['user'] as IDecodeUserDetails;
      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin is authorized to update emission factors');
      }

      const result = await this.servicesService.updateEmissionFactor(Number(id), dto);
      this.utilService.sendSuccessResponse(res, 'Emission factor updated successfully', result);
    } catch (error) {
      logger.error(`Error in updateEmissionFactor: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: updateEmissionFactor');
      res.end();
    }
  }

  @Delete('emission-factors/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an emission factor' })
  async deleteEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: deleteEmissionFactor');
    try {
      const user = req['user'] as IDecodeUserDetails;
      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin is authorized to delete emission factors');
      }

      const result = await this.servicesService.deleteEmissionFactor(Number(id));
      this.utilService.sendSuccessResponse(res, result.message, result);
    } catch (error) {
      logger.error(`Error in deleteEmissionFactor: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: deleteEmissionFactor');
      res.end();
    }
  }

  // --- INVENTORY ENTRIES ENDPOINTS ---

  @Get('inventory-entries')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inventory entries from DB with search, filter, sort, and pagination' })
  async getInventoryEntries(
    @Req() req: Request,
    @Res() res: Response,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('facility') facility?: string,
    @Query('status') status?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getInventoryEntries');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const orgId = user?.organizationId || 1;
      const result = await this.servicesService.getInventoryEntries(orgId, {
        category,
        search,
        facility,
        status,
        sortField,
        sortOrder,
        page,
        limit,
      });
      this.utilService.sendSuccessResponse(res, 'Successfully fetched inventory entries', result);
    } catch (error) {
      logger.error(`Error in getInventoryEntries: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getInventoryEntries');
      res.end();
    }
  }

  @Post('inventory-entries/filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated and filtered inventory entries list for useFetchList' })
  async getInventoryFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getInventoryFilterList');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const orgId = user?.organizationId || 1;

      const fullPayload = {
        ...payload,
        additionalFilter: {
          ...(payload.additionalFilter || {}),
          organizationId: orgId,
        },
      };

      const result = await this.servicesService.getInventoryFilterList(fullPayload);
      this.utilService.sendSuccessResponse(res, 'Successfully fetched inventory list', result);
    } catch (error) {
      logger.error(`Error in getInventoryFilterList: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getInventoryFilterList');
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

  @Post('inventory-entries/upload-document')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload proof of document file for an inventory entry' })
  async uploadInventoryDocument(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: uploadInventoryDocument');
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded or file invalid');
      }
      const documentPath = `uploads/inventory-docs/${file.filename}`;
      this.utilService.sendSuccessResponse(res, 'Proof document uploaded successfully', {
        documentPath,
        originalName: file.originalname,
        filename: file.filename,
      });
    } catch (error) {
      logger.error(`Error in uploadInventoryDocument: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: uploadInventoryDocument');
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
