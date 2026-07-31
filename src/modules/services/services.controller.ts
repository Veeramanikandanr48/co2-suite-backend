import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ServicesService } from './services.service';
import { SummaryService } from './summary.service';
import {
  AssignServicesDto,
  CreateScopeItemDto,
  CreateServiceDto,
} from 'src/dto/service.dto';
import {
  CreateEmissionFactorDto,
  CreateInventoryEntryDto,
  UpdateEmissionFactorDto,
  UpdateInventoryEntryDto,
} from 'src/dto/inventory.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@ApiTags('Services')
@Controller()
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly summaryService: SummaryService,
    private readonly utilService: UtilService,
  ) {}

  @Get('services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available master services from DB' })
  @ApiResponse({ status: 200, description: 'Successfully fetched services' })
  async getAllServices(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getAllServices');
    try {
      const result = await this.servicesService.getAllServices();
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched services',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch services. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getAllServices');
    }
  }

  @Post('services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new master service in DB dynamically (Super Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Service created successfully' })
  async createService(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateServiceDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: createService');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.createService(dto, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Service created successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to create service. Please try again later.',
      );
    } finally {
      logger.info('Method ended: createService');
    }
  }

  @Get('services/:code/scopes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get dynamic scope 1, 2, 3 service items from DB for a service module',
  })
  @ApiParam({ name: 'code', type: String, description: 'Service code' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched service scope items',
  })
  async getServiceScopes(
    @Req() req: Request,
    @Res() res: Response,
    @Param('code') code: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getServiceScopes');
    try {
      const result = await this.servicesService.getServiceScopes(code);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched service scope items',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch scope items. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getServiceScopes');
    }
  }

  @Get('services/:code/summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get overall carbon summary metrics, graphs, charts, and activities strictly from DB',
  })
  @ApiParam({ name: 'code', type: String, description: 'Service code' })
  @ApiQuery({ name: 'year', type: String, required: false })
  @ApiQuery({ name: 'facility', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched carbon summary',
  })
  async getCarbonSummary(
    @Req() req: Request,
    @Res() res: Response,
    @Param('code') code: string,
    @Query('year') year?: string,
    @Query('facility') facility?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getCarbonSummary');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.summaryService.getCarbonSummary(user, code, {
        year,
        facility,
      });
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched carbon summary',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch carbon summary. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getCarbonSummary');
    }
  }

  @Get('dashboard/summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get executive main dashboard overall summary metrics strictly from DB',
  })
  @ApiQuery({ name: 'year', type: String, required: false })
  @ApiQuery({ name: 'facility', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched dashboard summary',
  })
  async getExecutiveDashboardSummary(
    @Req() req: Request,
    @Res() res: Response,
    @Query('year') year?: string,
    @Query('facility') facility?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getExecutiveDashboardSummary');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.summaryService.getExecutiveDashboardSummary(
        user,
        { year, facility },
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched dashboard summary',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch dashboard summary. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getExecutiveDashboardSummary');
    }
  }

  @Post('services/scopes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a new Scope item to DB dynamically (Super Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Scope item created successfully' })
  async createScopeItem(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateScopeItemDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: createScopeItem');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.createScopeItem(dto, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Scope item created successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to create scope item. Please try again later.',
      );
    } finally {
      logger.info('Method ended: createScopeItem');
    }
  }

  @Post('services/scopes/:id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a Scope item (Super Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Scope item ID' })
  @ApiResponse({
    status: 200,
    description: 'Scope item deactivated successfully',
  })
  async deactivateScopeItem(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: deactivateScopeItem');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.deactivateScopeItem(id, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Scope item deactivated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate scope item. Please try again later.',
      );
    } finally {
      logger.info('Method ended: deactivateScopeItem');
    }
  }

  // --- EMISSION FACTORS ENDPOINTS ---

  @Get('emission-factors')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get emission factors and dropdown calculation parameters from DB',
  })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched emission factors',
  })
  async getEmissionFactors(
    @Req() req: Request,
    @Res() res: Response,
    @Query('category') category?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getEmissionFactors');
    try {
      const result = await this.servicesService.getEmissionFactors(category);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched emission factors',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch emission factors. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getEmissionFactors');
    }
  }

  @Post('emission-factors')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new emission factor in DB dynamically' })
  @ApiResponse({
    status: 200,
    description: 'Emission factor created successfully',
  })
  async createEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateEmissionFactorDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: createEmissionFactor');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.createEmissionFactor(dto, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Emission factor created successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to create emission factor. Please try again later.',
      );
    } finally {
      logger.info('Method ended: createEmissionFactor');
    }
  }

  @Post('emission-factors/filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Filter and paginate emission factors with search, sort, category',
  })
  @ApiResponse({
    status: 200,
    description: 'Emission factors filter list fetched successfully',
  })
  async getEmissionFactorsFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getEmissionFactorsFilterList');
    try {
      const result =
        await this.servicesService.getEmissionFactorsFilterList(payload);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Emission factors list fetched successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch emission factors. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getEmissionFactorsFilterList');
    }
  }

  @Put('emission-factors/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing emission factor' })
  @ApiParam({ name: 'id', type: Number, description: 'Emission factor ID' })
  @ApiResponse({
    status: 200,
    description: 'Emission factor updated successfully',
  })
  async updateEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmissionFactorDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: updateEmissionFactor');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.updateEmissionFactor(
        id,
        dto,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Emission factor updated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update emission factor. Please try again later.',
      );
    } finally {
      logger.info('Method ended: updateEmissionFactor');
    }
  }

  @Post('emission-factors/:id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an emission factor' })
  @ApiParam({ name: 'id', type: Number, description: 'Emission factor ID' })
  @ApiResponse({
    status: 200,
    description: 'Emission factor deactivated successfully',
  })
  async deactivateEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: deactivateEmissionFactor');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.deactivateEmissionFactor(
        id,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Emission factor deactivated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate emission factor. Please try again later.',
      );
    } finally {
      logger.info('Method ended: deactivateEmissionFactor');
    }
  }

  // --- INVENTORY ENTRIES ENDPOINTS ---

  @Get('inventory-entries')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get inventory entries from DB with search, filter, sort, and pagination',
  })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'facility', type: String, required: false })
  @ApiQuery({ name: 'status', type: String, required: false })
  @ApiQuery({ name: 'sortField', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['ASC', 'DESC'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched inventory entries',
  })
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
    logger.info('Method started: getInventoryEntries');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.getInventoryEntries(user, {
        category,
        search,
        facility,
        status,
        sortField,
        sortOrder,
        page,
        limit,
      });
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched inventory entries',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch inventory entries. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getInventoryEntries');
    }
  }

  @Post('inventory-entries/filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get paginated and filtered inventory entries list',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched inventory list',
  })
  async getInventoryFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getInventoryFilterList');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.getInventoryFilterList(
        payload,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched inventory list',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch inventory list. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getInventoryFilterList');
    }
  }

  @Post('inventory-entries')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save new inventory entry to DB with formula calculation',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory entry saved successfully',
  })
  async createInventoryEntry(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateInventoryEntryDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: createInventoryEntry');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.createInventoryEntry(user, dto);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Inventory entry saved successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to save inventory entry. Please try again later.',
      );
    } finally {
      logger.info('Method ended: createInventoryEntry');
    }
  }

  @Post('inventory-entries/upload-document')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload proof of document file for an inventory entry',
  })
  @ApiResponse({ status: 200, description: 'Document uploaded successfully' })
  async uploadInventoryDocument(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: uploadInventoryDocument');
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
      const documentPath = `uploads/inventory-docs/${file.filename}`;
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Document uploaded successfully',
        {
          documentPath,
          originalName: file.originalname,
          filename: file.filename,
        },
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to upload document. Please try again later.',
      );
    } finally {
      logger.info('Method ended: uploadInventoryDocument');
    }
  }

  @Put('inventory-entries/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update existing inventory entry in DB' })
  @ApiParam({ name: 'id', type: Number, description: 'Inventory entry ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory entry updated successfully',
  })
  async updateInventoryEntry(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryEntryDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: updateInventoryEntry');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.updateInventoryEntry(
        user,
        id,
        dto,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Inventory entry updated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update inventory entry. Please try again later.',
      );
    } finally {
      logger.info('Method ended: updateInventoryEntry');
    }
  }

  @Post('inventory-entries/:id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate inventory entry from DB' })
  @ApiParam({ name: 'id', type: Number, description: 'Inventory entry ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory entry deactivated successfully',
  })
  async deactivateInventoryEntry(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: deactivateInventoryEntry');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.deactivateInventoryEntry(
        user,
        id,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Inventory entry deactivated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate inventory entry. Please try again later.',
      );
    } finally {
      logger.info('Method ended: deactivateInventoryEntry');
    }
  }

  @Get('organizations/:id/services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get services subscribed by an organization' })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched organization services',
  })
  async getOrgServices(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getOrgServices');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.getOrgServices(id, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organization services',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch organization services. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getOrgServices');
    }
  }

  @Post('organizations/:id/services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign services to an organization (Super Admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Services assigned successfully' })
  async assignServices(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignServicesDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: assignServices');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.assignServices(id, dto, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Services assigned successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to assign services. Please try again later.',
      );
    } finally {
      logger.info('Method ended: assignServices');
    }
  }

  @Post('organizations/:id/services/:serviceId/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove a service from an organization (Super Admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiParam({ name: 'serviceId', type: Number, description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service removed successfully' })
  async removeOrgService(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: removeOrgService');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.removeOrgService(
        id,
        serviceId,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Service removed successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to remove service. Please try again later.',
      );
    } finally {
      logger.info('Method ended: removeOrgService');
    }
  }

  @Get('services/result/:scope/:activity')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get scope calculation activity result items matching enterprise API payload format',
  })
  @ApiParam({
    name: 'scope',
    type: String,
    description: 'Scope ID e.g. 1, 2, or 3',
  })
  @ApiParam({
    name: 'activity',
    type: String,
    description: 'Activity code e.g. SC, MC, FE, PE, PGS',
  })
  @ApiQuery({ name: 'based_option', type: String, required: false })
  @ApiQuery({ name: 'facility', type: String, required: false })
  @ApiQuery({ name: 'year', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched activity results',
  })
  async getScopeResultByActivity(
    @Req() req: Request,
    @Res() res: Response,
    @Param('scope') scope: string,
    @Param('activity') activity: string,
    @Query('based_option') basedOption?: string,
    @Query('facility') facility?: string,
    @Query('year') year?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getScopeResultByActivity');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.getScopeResultByActivity(
        user,
        scope,
        activity,
        { based_option: basedOption, facility, year },
      );
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch activity results',
      );
    } finally {
      logger.info('Method ended: getScopeResultByActivity');
    }
  }

  @Get('services/factor-signature')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get factor signature metadata for activity code',
  })
  @ApiQuery({ name: 'scope', type: String, required: false })
  @ApiQuery({ name: 'activity', type: String, required: true })
  @ApiQuery({ name: 'based_option', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched factor signature',
  })
  async getFactorSignature(
    @Req() req: Request,
    @Res() res: Response,
    @Query('scope') scope: string,
    @Query('activity') activity: string,
    @Query('based_option') basedOption?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getFactorSignature');
    try {
      const result = await this.servicesService.getFactorSignature(
        scope || '1',
        activity,
        basedOption,
      );
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch factor signature',
      );
    } finally {
      logger.info('Method ended: getFactorSignature');
    }
  }

  @Get('services/results/activity/:activity')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get calculation results for a specific activity code',
  })
  @ApiParam({
    name: 'activity',
    type: String,
    description: 'Activity code (e.g. SC, MC, FE, PE, PGS)',
  })
  async getResultsByActivityCode(
    @Req() req: Request,
    @Res() res: Response,
    @Param('activity') activity: string,
    @Query('based_option') basedOption?: string,
    @Query('facility') facility?: string,
    @Query('year') year?: string,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getResultsByActivityCode');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.servicesService.getScopeResultByActivity(
        user,
        '1',
        activity,
        { based_option: basedOption, facility, year },
      );
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch activity results',
      );
    } finally {
      logger.info('Method ended: getResultsByActivityCode');
    }
  }

  @Get('services/activities')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get list of all supported enterprise activity codes dynamically from DB',
  })
  async getAllActivityCodes(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method started: getAllActivityCodes');
    try {
      const activities = await this.servicesService.getAllActivityCodes();
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched activities',
        activities,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch activities',
      );
    } finally {
      logger.info('Method ended: getAllActivityCodes');
    }
  }
}
