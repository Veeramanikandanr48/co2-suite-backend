import {
  Body,
  Controller,
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
} from 'src/dto/master.dto';
import { MasterEntityType } from './master.service';

@ApiTags('Master')
@Controller('master')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MasterController {
  constructor(
    private readonly masterService: MasterService,
    private readonly utilService: UtilService,
  ) {}

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
}
