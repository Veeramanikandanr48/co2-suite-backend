import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { MasterService } from './master.service';
import { EmissionFactorService } from './emission-factor.service';
import { UtilService } from 'src/utility/util/util.service';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';
import {
  CreateMasterScopeDto,
  CreateMasterCategoryDto,
  CreateMasterFuelDto,
  CreateMasterUnitDto,
  CreateMasterDatasourceDto,
  CreateMasterFactorVersionDto,
  CreateMasterFormulaDto,
  CreateScopeCategoryMappingDto,
  CreateCategoryDatasourceMappingDto,
  CreateVersionFuelMappingDto,
  CreateFuelUnitMappingDto,
  CreateUnitFormulaMappingDto,
} from 'src/dto/master.dto';
import { MasterEntityType } from './master.service';
import { UpsertEmissionFactorDto, ResolveEmissionFactorQueryDto } from 'src/dto/emission-factor.dto';

@ApiTags('Master')
@Controller('master')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MasterController {
  constructor(
    private readonly masterService: MasterService,
    private readonly emissionFactorService: EmissionFactorService,
    private readonly utilService: UtilService,
  ) {}

  // ─── Unified Dynamic Master Options ──────────────────────────────────────

  @Get('options')
  @ApiOperation({ summary: 'Get dynamic master options filtered by type' })
  async getMasterOptions(
    @Req() req: Request,
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterOptions');
    try {
      const result = await this.masterService.getMasterOptions(
        type as any,
        limit ? parseInt(limit, 10) : 500,
      );
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master options', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master options.');
    }
  }

  @Post('options')
  @ApiOperation({ summary: 'Create or update dynamic master option' })
  async upsertMasterOption(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() body: any,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterOption');
    try {
      const result = await this.masterService.upsertMasterOption(body, user.id);
      return this.utilService.sendSuccessResponse(res, 'Master option saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to save master option.');
    }
  }

  @Delete('options/:id')
  @ApiOperation({ summary: 'Deactivate dynamic master option' })
  async deactivateMasterOption(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: deactivateMasterOption');
    try {
      const result = await this.masterService.deactivateMasterOption(id, user.id);
      return this.utilService.sendSuccessResponse(res, 'Master option deactivated successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to deactivate master option.');
    }
  }

  // ─── GET: Master Scope ────────────────────────────────────────────────────

  @Get('scopes')
  @ApiOperation({ summary: 'Get all active master scopes (emission categories)' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master scopes' })
  @ApiResponse({ status: 400, description: 'Failed to fetch master scopes' })
  async getMasterScopes(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterScopes');
    try {
      const result = await this.masterService.getMasterScopes(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master scopes', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master scopes. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterScopes');
    }
  }

  // ─── GET: Master Category ─────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all active master categories' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master categories' })
  @ApiResponse({ status: 400, description: 'Failed to fetch master categories' })
  async getMasterCategories(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterCategories');
    try {
      const result = await this.masterService.getMasterCategories(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master categories', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master categories. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterCategories');
    }
  }

  // ─── GET: Master Fuel ─────────────────────────────────────────────────────

  @Get('fuels')
  @ApiOperation({ summary: 'Get all active master fuels (fuel / gas types)' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master fuels' })
  @ApiResponse({ status: 400, description: 'Failed to fetch master fuels' })
  async getMasterFuels(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterFuels');
    try {
      const result = await this.masterService.getMasterFuels(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master fuels', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master fuels. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterFuels');
    }
  }

  // ─── GET: Master Unit ─────────────────────────────────────────────────────

  @Get('units')
  @ApiOperation({ summary: 'Get all active master units of measurement' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master units' })
  @ApiResponse({ status: 400, description: 'Failed to fetch master units' })
  async getMasterUnits(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterUnits');
    try {
      const result = await this.masterService.getMasterUnits(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master units', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master units. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterUnits');
    }
  }

  // ─── GET: Master Datasource ───────────────────────────────────────────────

  @Get('datasources')
  @ApiOperation({ summary: 'Get all active master data sources (DEFRA, IPCC, EPA…)' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master datasources' })
  @ApiResponse({ status: 400, description: 'Failed to fetch master datasources' })
  async getMasterDatasources(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterDatasources');
    try {
      const result = await this.masterService.getMasterDatasources(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master datasources', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master datasources. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterDatasources');
    }
  }

  // ─── GET: Master Factor Version ───────────────────────────────────────────

  @Get('factor-versions')
  @ApiOperation({ summary: 'Get all active master factor versions (e.g. AR6, 2024)' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master factor versions' })
  @ApiResponse({ status: 400, description: 'Failed to fetch master factor versions' })
  async getMasterFactorVersions(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterFactorVersions');
    try {
      const result = await this.masterService.getMasterFactorVersions(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master factor versions', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master factor versions. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterFactorVersions');
    }
  }

  // ─── GET: Master Formula ──────────────────────────────────────────────────

  @Get('formulas')
  @ApiOperation({ summary: 'Get all active master formula templates' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master formulas' })
  @ApiResponse({ status: 400, description: 'Failed to fetch master formulas' })
  async getMasterFormulas(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterFormulas');
    try {
      const result = await this.masterService.getMasterFormulas(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master formulas', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master formulas. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterFormulas');
    }
  }

  // ─── POST (Upsert): Master Scope ──────────────────────────────────────────
  // No id in body → CREATE  |  id in body → UPDATE

  @Post('scopes')
  @ApiOperation({ summary: 'Create or update a master scope. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateMasterScopeDto })
  @ApiResponse({ status: 200, description: 'Master scope saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save master scope' })
  async upsertMasterScope(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateMasterScopeDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterScope');
    try {
      const result = await this.masterService.upsertMasterRecord('scope' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Master scope saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save master scope.');
    } finally {
      logger.info('Method ended: upsertMasterScope');
    }
  }

  // ─── POST (Upsert): Master Category ───────────────────────────────────────

  @Post('categories')
  @ApiOperation({ summary: 'Create or update a master category. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateMasterCategoryDto })
  @ApiResponse({ status: 200, description: 'Master category saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save master category' })
  async upsertMasterCategory(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateMasterCategoryDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterCategory');
    try {
      const result = await this.masterService.upsertMasterRecord('category' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Master category saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save master category.');
    } finally {
      logger.info('Method ended: upsertMasterCategory');
    }
  }

  // ─── POST (Upsert): Master Fuel ───────────────────────────────────────────

  @Post('fuels')
  @ApiOperation({ summary: 'Create or update a master fuel. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateMasterFuelDto })
  @ApiResponse({ status: 200, description: 'Master fuel saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save master fuel' })
  async upsertMasterFuel(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateMasterFuelDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterFuel');
    try {
      const result = await this.masterService.upsertMasterRecord('fuel' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Master fuel saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save master fuel.');
    } finally {
      logger.info('Method ended: upsertMasterFuel');
    }
  }

  // ─── POST (Upsert): Master Unit ───────────────────────────────────────────

  @Post('units')
  @ApiOperation({ summary: 'Create or update a master unit. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateMasterUnitDto })
  @ApiResponse({ status: 200, description: 'Master unit saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save master unit' })
  async upsertMasterUnit(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateMasterUnitDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterUnit');
    try {
      const result = await this.masterService.upsertMasterRecord('unit' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Master unit saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save master unit.');
    } finally {
      logger.info('Method ended: upsertMasterUnit');
    }
  }

  // ─── POST (Upsert): Master Datasource ────────────────────────────────────

  @Post('datasources')
  @ApiOperation({ summary: 'Create or update a master datasource. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateMasterDatasourceDto })
  @ApiResponse({ status: 200, description: 'Master datasource saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save master datasource' })
  async upsertMasterDatasource(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateMasterDatasourceDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterDatasource');
    try {
      const result = await this.masterService.upsertMasterRecord('datasource' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Master datasource saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save master datasource.');
    } finally {
      logger.info('Method ended: upsertMasterDatasource');
    }
  }

  // ─── POST (Upsert): Master Factor Version ────────────────────────────────

  @Post('factor-versions')
  @ApiOperation({ summary: 'Create or update a master factor version. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateMasterFactorVersionDto })
  @ApiResponse({ status: 200, description: 'Master factor version saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save master factor version' })
  async upsertMasterFactorVersion(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateMasterFactorVersionDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterFactorVersion');
    try {
      const result = await this.masterService.upsertMasterRecord('factor-version' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Master factor version saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save master factor version.');
    } finally {
      logger.info('Method ended: upsertMasterFactorVersion');
    }
  }

  // ─── POST (Upsert): Master Formula ───────────────────────────────────────

  @Post('formulas')
  @ApiOperation({ summary: 'Create or update a master formula. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateMasterFormulaDto })
  @ApiResponse({ status: 200, description: 'Master formula saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save master formula' })
  async upsertMasterFormula(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateMasterFormulaDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertMasterFormula');
    try {
      const result = await this.masterService.upsertMasterRecord('formula' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Master formula saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save master formula.');
    } finally {
      logger.info('Method ended: upsertMasterFormula');
    }
  }

  // ─── GET: Scope Category Mappings ─────────────────────────────────────────

  @Get('scope-category-mappings')
  @ApiOperation({ summary: 'Get all active scope category mappings' })
  @ApiResponse({ status: 200, description: 'Successfully fetched scope category mappings' })
  @ApiResponse({ status: 400, description: 'Failed to fetch scope category mappings' })
  async getMasterScopeCategoryMappings(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterScopeCategoryMappings');
    try {
      const result = await this.masterService.getMasterScopeCategoryMappings(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched scope category mappings', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch scope category mappings. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterScopeCategoryMappings');
    }
  }

  // ─── POST (Upsert): Scope Category Mapping ────────────────────────────────

  @Post('scope-category-mappings')
  @ApiOperation({ summary: 'Create or update a scope category mapping. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateScopeCategoryMappingDto })
  @ApiResponse({ status: 200, description: 'Scope category mapping saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save scope category mapping' })
  async upsertScopeCategoryMapping(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateScopeCategoryMappingDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertScopeCategoryMapping');
    try {
      const result = await this.masterService.upsertMasterRecord('scope-category-mapping' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Scope category mapping saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save scope category mapping.');
    } finally {
      logger.info('Method ended: upsertScopeCategoryMapping');
    }
  }

  // ─── GET: Category Datasource Mappings ────────────────────────────────────

  @Get('category-datasource-mappings')
  @ApiOperation({ summary: 'Get all active category datasource mappings' })
  @ApiResponse({ status: 200, description: 'Successfully fetched category datasource mappings' })
  @ApiResponse({ status: 400, description: 'Failed to fetch category datasource mappings' })
  async getMasterCategoryDatasourceMappings(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterCategoryDatasourceMappings');
    try {
      const result = await this.masterService.getMasterCategoryDatasourceMappings(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched category datasource mappings', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch category datasource mappings. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterCategoryDatasourceMappings');
    }
  }

  // ─── POST (Upsert): Category Datasource Mapping ───────────────────────────

  @Post('category-datasource-mappings')
  @ApiOperation({ summary: 'Create or update a category datasource mapping. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateCategoryDatasourceMappingDto })
  @ApiResponse({ status: 200, description: 'Category datasource mapping saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save category datasource mapping' })
  async upsertCategoryDatasourceMapping(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateCategoryDatasourceMappingDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertCategoryDatasourceMapping');
    try {
      const result = await this.masterService.upsertMasterRecord('category-datasource-mapping' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Category datasource mapping saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save category datasource mapping.');
    } finally {
      logger.info('Method ended: upsertCategoryDatasourceMapping');
    }
  }

  // ─── GET: Version Fuel Mappings ───────────────────────────────────────────

  @Get('version-fuel-mappings')
  @ApiOperation({ summary: 'Get all active factor version to fuel mappings' })
  @ApiResponse({ status: 200, description: 'Successfully fetched version fuel mappings' })
  @ApiResponse({ status: 400, description: 'Failed to fetch version fuel mappings' })
  async getMasterVersionFuelMappings(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterVersionFuelMappings');
    try {
      const result = await this.masterService.getMasterVersionFuelMappings(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched version fuel mappings', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch version fuel mappings. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterVersionFuelMappings');
    }
  }

  // ─── POST (Upsert): Version Fuel Mapping ──────────────────────────────────

  @Post('version-fuel-mappings')
  @ApiOperation({ summary: 'Create or update a version fuel mapping. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateVersionFuelMappingDto })
  @ApiResponse({ status: 200, description: 'Version fuel mapping saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save version fuel mapping' })
  async upsertVersionFuelMapping(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateVersionFuelMappingDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertVersionFuelMapping');
    try {
      const result = await this.masterService.upsertMasterRecord('version-fuel-mapping' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Version fuel mapping saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save version fuel mapping.');
    } finally {
      logger.info('Method ended: upsertVersionFuelMapping');
    }
  }

  // ─── GET: Fuel Unit Mappings ──────────────────────────────────────────────

  @Get('fuel-unit-mappings')
  @ApiOperation({ summary: 'Get all active fuel to unit mappings' })
  @ApiResponse({ status: 200, description: 'Successfully fetched fuel unit mappings' })
  @ApiResponse({ status: 400, description: 'Failed to fetch fuel unit mappings' })
  async getMasterFuelUnitMappings(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterFuelUnitMappings');
    try {
      const result = await this.masterService.getMasterFuelUnitMappings(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched fuel unit mappings', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch fuel unit mappings. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterFuelUnitMappings');
    }
  }

  // ─── POST (Upsert): Fuel Unit Mapping ─────────────────────────────────────

  @Post('fuel-unit-mappings')
  @ApiOperation({ summary: 'Create or update a fuel unit mapping. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateFuelUnitMappingDto })
  @ApiResponse({ status: 200, description: 'Fuel unit mapping saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save fuel unit mapping' })
  async upsertFuelUnitMapping(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateFuelUnitMappingDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertFuelUnitMapping');
    try {
      const result = await this.masterService.upsertMasterRecord('fuel-unit-mapping' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Fuel unit mapping saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save fuel unit mapping.');
    } finally {
      logger.info('Method ended: upsertFuelUnitMapping');
    }
  }

  // ─── GET: Unit Formula Mappings ───────────────────────────────────────────

  @Get('unit-formula-mappings')
  @ApiOperation({ summary: 'Get all active unit to formula mappings' })
  @ApiResponse({ status: 200, description: 'Successfully fetched unit formula mappings' })
  @ApiResponse({ status: 400, description: 'Failed to fetch unit formula mappings' })
  async getMasterUnitFormulaMappings(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: getMasterUnitFormulaMappings');
    try {
      const result = await this.masterService.getMasterUnitFormulaMappings(query);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched unit formula mappings', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch unit formula mappings. Please try again later.');
    } finally {
      logger.info('Method ended: getMasterUnitFormulaMappings');
    }
  }

  // ─── POST (Upsert): Unit Formula Mapping ──────────────────────────────────

  @Post('unit-formula-mappings')
  @ApiOperation({ summary: 'Create or update a unit formula mapping. Omit id to create; include id to update.' })
  @ApiBody({ type: CreateUnitFormulaMappingDto })
  @ApiResponse({ status: 200, description: 'Unit formula mapping saved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to save unit formula mapping' })
  async upsertUnitFormulaMapping(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateUnitFormulaMappingDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertUnitFormulaMapping');
    try {
      const result = await this.masterService.upsertMasterRecord('unit-formula-mapping' as MasterEntityType, dto as unknown as Record<string, unknown>, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, 'Unit formula mapping saved successfully', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save unit formula mapping.');
    } finally {
      logger.info('Method ended: upsertUnitFormulaMapping');
    }
  }

  // ─── Emission Factors ─────────────────────────────────────────────────────

  @Get('emission-factors')
  @ApiOperation({ summary: 'List emission factors with optional filters' })
  async listEmissionFactors(
    @Req() req: Request,
    @Res() res: Response,
    @Query('calculationMethod') calculationMethod?: string,
    @Query('factorVersionId') factorVersionId?: string,
    @Query('fuelId') fuelId?: string,
    @Query('geography') geography?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: listEmissionFactors');
    try {
      const result = await this.emissionFactorService.listEmissionFactors({
        calculationMethod,
        factorVersionId: factorVersionId ? parseInt(factorVersionId, 10) : undefined,
        fuelId: fuelId ? parseInt(fuelId, 10) : undefined,
        geography,
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 200,
      });
      return this.utilService.sendSuccessResponse(res, 'Emission factors fetched', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to fetch emission factors.');
    } finally {
      logger.info('Method ended: listEmissionFactors');
    }
  }

  @Get('emission-factors/resolve')
  @ApiOperation({ summary: 'Resolve best-matching emission factor for a given query' })
  async resolveEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: ResolveEmissionFactorQueryDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: resolveEmissionFactor');
    try {
      const result = await this.emissionFactorService.resolveFromQuery(query);
      return this.utilService.sendSuccessResponse(res, 'Emission factor resolved', result);
    } catch (error) {
      logger.error('EF resolve failed', error);
      // Propagate 422 EF_NOT_FOUND directly
      if (error?.status === 422) {
        return res.status(422).json(error.response);
      }
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to resolve emission factor.');
    } finally {
      logger.info('Method ended: resolveEmissionFactor');
    }
  }

  @Post('emission-factors')
  @ApiOperation({ summary: 'Create or update an emission factor' })
  @ApiBody({ type: UpsertEmissionFactorDto })
  async upsertEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: UpsertEmissionFactorDto,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: upsertEmissionFactor');
    try {
      const result = await this.emissionFactorService.upsertEmissionFactor(dto, user?.id);
      return this.utilService.sendSuccessResponse(res, 'Emission factor saved', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to save emission factor.');
    } finally {
      logger.info('Method ended: upsertEmissionFactor');
    }
  }

  @Delete('emission-factors/:id')
  @ApiOperation({ summary: 'Soft-delete (deactivate) an emission factor' })
  async deactivateEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(MasterController.name, req);
    logger.info('Method started: deactivateEmissionFactor');
    try {
      const result = await this.emissionFactorService.deactivateEmissionFactor(id, user?.id);
      return this.utilService.sendSuccessResponse(res, 'Emission factor deactivated', result);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, error?.message ?? 'Failed to deactivate emission factor.');
    } finally {
      logger.info('Method ended: deactivateEmissionFactor');
    }
  }
}
