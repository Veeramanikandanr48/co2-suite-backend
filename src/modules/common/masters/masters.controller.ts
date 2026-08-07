import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MastersService } from './masters.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';
import { Roles } from 'src/auth/roles.decorator';
import { MasterRole } from 'src/enums/casl.enum';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import {
  BulkImportMasterItemsDto,
  CreateCalculationPolicyDto,
  CreateChangeRequestDto,
  CreateEmissionFactorRowDto,
  CreateEmissionFactorSetDto,
  CreateEmissionFactorValueDto,
  CreateFormulaLibraryDto,
  CreateGasMultiplierDto,
  CreateGasTypeDto,
  CreateGwpVersionDto,
  CreateMasterItemDto,
  CreateSupplementaryFieldDto,
  CreateUnitConversionDto,
  ReviewChangeRequestDto,
  UpdateMasterItemDto,
  UpdateUnitConversionDto,
} from 'src/dto/master-config.dto';

@ApiTags('Masters')
@Controller('masters')
export class MastersController {
  constructor(
    private readonly mastersService: MastersService,
    private readonly utilService: UtilService,
  ) {}

  // ============================================================================
  // EXISTING MASTER ENDPOINTS
  // ============================================================================

  @Get('getMasterRoles')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get master roles' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master roles' })
  async getMasterRoles(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    try {
      const result = await this.mastersService.getMasterRoles();
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched master roles', result);
    } catch (error) {
      logger.error('Error in getMasterRoles', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch master roles');
    }
  }

  @Get('getMasterApprovalStatuses')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get master approval statuses' })
  @ApiResponse({ status: 200, description: 'Successfully fetched master approval statuses' })
  async getMasterApprovalStatuses(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    try {
      const result = await this.mastersService.getMasterApprovalStatuses();
      return this.utilService.sendSuccessResponse(res, 'Successfully fetched approval statuses', result);
    } catch (error) {
      logger.error('Error in getMasterApprovalStatuses', error);
      return this.utilService.sendErrorResponse(res, 'Failed to fetch approval statuses');
    }
  }

  // ============================================================================
  // GAS TYPES & GWP VERSIONS
  // ============================================================================

  @Get('gas-types')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get master gas types (CO2, CH4, N2O, SF6, etc.)' })
  async getGasTypes(@Res() res: Response) {
    const result = await this.mastersService.getGasTypes();
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched gas types', result);
  }

  @Post('gas-types')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new gas type (Admin only)' })
  async createGasType(@Body() dto: CreateGasTypeDto, @Res() res: Response) {
    const result = await this.mastersService.createGasType(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created gas type', result);
  }

  @Get('gwp-versions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get GWP versions (AR5, AR6) with per-gas multipliers' })
  async getGwpVersions(@Res() res: Response) {
    const result = await this.mastersService.getGwpVersions();
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched GWP versions', result);
  }

  @Post('gwp-versions')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new GWP version (Admin only)' })
  async createGwpVersion(@Body() dto: CreateGwpVersionDto, @Res() res: Response) {
    const result = await this.mastersService.createGwpVersion(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created GWP version', result);
  }

  @Post('gas-multipliers')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set GWP multiplier for a gas type in a GWP version (Admin only)' })
  async addGasMultiplier(@Body() dto: CreateGasMultiplierDto, @Res() res: Response) {
    const result = await this.mastersService.addGasMultiplier(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully added GWP gas multiplier', result);
  }

  // ============================================================================
  // NORMALIZED EMISSION FACTOR SETS
  // ============================================================================

  @Get('factor-sets')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get normalized emission factor sets with rows and gas values' })
  async getFactorSets(@Res() res: Response) {
    const result = await this.mastersService.getEmissionFactorSets();
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched emission factor sets', result);
  }

  @Post('factor-sets')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create emission factor set header (Admin only)' })
  async createFactorSet(@Body() dto: CreateEmissionFactorSetDto, @Res() res: Response) {
    const result = await this.mastersService.createEmissionFactorSet(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created emission factor set', result);
  }

  @Post('factor-rows')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a fuel/unit row to an emission factor set (Admin only)' })
  async createFactorRow(@Body() dto: CreateEmissionFactorRowDto, @Res() res: Response) {
    const result = await this.mastersService.createEmissionFactorRow(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created emission factor row', result);
  }

  @Post('factor-values')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set per-gas factor value on an emission factor row (Admin only)' })
  async addFactorValue(@Body() dto: CreateEmissionFactorValueDto, @Res() res: Response) {
    const result = await this.mastersService.addEmissionFactorValue(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully added emission factor gas value', result);
  }

  // ============================================================================
  // FORMULA LIBRARY & CALCULATION POLICIES
  // ============================================================================

  @Get('formulas')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin-configurable formula library' })
  async getFormulas(@Res() res: Response) {
    const result = await this.mastersService.getFormulaLibraries();
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched formula library', result);
  }

  @Post('formulas')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new named calculation formula (Admin only)' })
  async createFormula(@Body() dto: CreateFormulaLibraryDto, @Res() res: Response) {
    const result = await this.mastersService.createFormulaLibrary(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created formula', result);
  }

  @Get('policies')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get calculation policies (factor set + GWP + formula bindings)' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getPolicies(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : undefined;
    const result = await this.mastersService.getCalculationPolicies(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched calculation policies', result);
  }

  @Post('policies')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a calculation policy binding (Admin only)' })
  async createPolicy(@Body() dto: CreateCalculationPolicyDto, @Res() res: Response) {
    const result = await this.mastersService.createCalculationPolicy(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created calculation policy', result);
  }

  // ============================================================================
  // SUPPLEMENTARY FIELDS
  // ============================================================================

  @Get('supplementary-fields')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dynamic supplementary form field definitions by category' })
  @ApiQuery({ name: 'category', required: false })
  async getSupplementaryFields(@Query('category') category: string, @Res() res: Response) {
    const result = await this.mastersService.getSupplementaryFields(category);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched supplementary field definitions', result);
  }

  @Post('supplementary-fields')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create dynamic supplementary field definition (Admin only)' })
  async createSupplementaryField(@Body() dto: CreateSupplementaryFieldDto, @Res() res: Response) {
    const result = await this.mastersService.createSupplementaryField(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created supplementary field definition', result);
  }

  // ============================================================================
  // DYNAMIC MASTER ITEM CRUD ENDPOINTS
  // ============================================================================

  @Get('sidebar-structure')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch zero-config dynamic sidebar structure for active workspace' })
  @ApiQuery({ name: 'serviceCode', required: false })
  async getSidebarStructure(
    @Query('serviceCode') serviceCode: string,
    @Res() res: Response,
  ) {
    const result = await this.mastersService.getSidebarStructure(serviceCode);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched sidebar structure', result);
  }

  @Get('types/:code/schema')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch on-demand UI, validation, grid & workflow schemas for a master type' })
  async getMasterTypeSchema(
    @Param('code') code: string,
    @Res() res: Response,
  ) {
    const result = await this.mastersService.getMasterTypeSchema(code);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched master type schema', result);
  }

  @Get('supported-types')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch dynamic supported master item types for a service domain' })
  @ApiQuery({ name: 'serviceCode', required: false })
  async getSupportedTypes(
    @Query('serviceCode') serviceCode: string,
    @Res() res: Response,
  ) {
    const result = await this.mastersService.getSupportedTypesForService(serviceCode);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched supported master item types', result);
  }

  @Get('items')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch dynamic master items (Fuel Types, Categories, Units, Gas Types)' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'serviceCode', required: false })
  async getMasterItems(
    @Query('type') type: string,
    @Query('parentId') parentId: string,
    @Query('search') search: string,
    @Query('serviceCode') serviceCode: string,
    @Res() res: Response,
  ) {
    const parsedParentId = parentId ? parseInt(parentId, 10) : undefined;
    const result = await this.mastersService.getMasterItems(type, parsedParentId, search, serviceCode);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched master items', result);
  }

  @Post('items/filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter dynamic master items for table pagination' })
  async filterMasterItems(@Body() payload: CommonListPayloadDto, @Res() res: Response) {
    const result = await this.mastersService.filterMasterItems(payload);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched master items', result);
  }

  @Post('items')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new dynamic master item (Admin only)' })
  async createMasterItem(@Body() dto: CreateMasterItemDto, @Res() res: Response) {
    const result = await this.mastersService.createMasterItem(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created master item', result);
  }

  @Put('items/:id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing master item (Admin only)' })
  async updateMasterItem(
    @Param('id') id: string,
    @Body() dto: UpdateMasterItemDto,
    @Res() res: Response,
  ) {
    const result = await this.mastersService.updateMasterItem(parseInt(id, 10), dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully updated master item', result);
  }

  @Post('items/bulk-delete')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk soft delete / Deactivate master items in a single request (Admin only)' })
  async bulkDeleteMasterItems(@Req() req: any, @Body() body: { ids: (number | string)[] }, @Res() res: Response) {
    const user: any = req.user;
    const result = await this.mastersService.bulkDeleteMasterItems(body?.ids || [], user?.id);
    return this.utilService.sendSuccessResponse(res, 'Successfully deactivated master items in bulk', result);
  }

  @Delete('items/:id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete / Deactivate a master item (Admin only)' })
  async deleteMasterItem(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const user: any = req.user;
    await this.mastersService.softDeleteMasterItem(parseInt(id, 10), user?.id);
    return this.utilService.sendSuccessResponse(res, 'Successfully deactivated master item', null);
  }

  @Get('items/:id/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revision history timeline for a master item' })
  async getMasterItemHistory(@Param('id') id: string, @Res() res: Response) {
    const result = await this.mastersService.getMasterItemHistory(parseInt(id, 10));
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched master item revision history', result);
  }

  @Get('matrix/export')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export full carbon accounting master matrix rows for single-sheet Excel' })
  async exportMasterMatrix(@Res() res: Response) {
    const result = await this.mastersService.exportMasterMatrix();
    return this.utilService.sendSuccessResponse(res, 'Successfully exported master matrix rows', result);
  }

  @Get('items/:id/references')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if master item is referenced before deletion/archival' })
  async checkMasterItemReferences(@Param('id') id: string, @Res() res: Response) {
    const result = await this.mastersService.checkMasterItemReferences(parseInt(id, 10));
    return this.utilService.sendSuccessResponse(res, 'Reference validation complete', result);
  }

  @Post('items/:id/publish')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a master item (Admin only)' })
  async publishMasterItem(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const user: any = req.user;
    const result = await this.mastersService.publishMasterItem(parseInt(id, 10), user?.id);
    return this.utilService.sendSuccessResponse(res, 'Master item published successfully', result);
  }

  @Post('items/:id/deprecate')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deprecate a master item (Admin only)' })
  async deprecateMasterItem(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const user: any = req.user;
    const result = await this.mastersService.deprecateMasterItem(parseInt(id, 10), user?.id);
    return this.utilService.sendSuccessResponse(res, 'Master item marked as deprecated', result);
  }

  @Post('items/:id/archive')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a master item (Admin only)' })
  async archiveMasterItem(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const user: any = req.user;
    const result = await this.mastersService.archiveMasterItem(parseInt(id, 10), user?.id);
    return this.utilService.sendSuccessResponse(res, 'Master item archived successfully', result);
  }

  // ============================================================================
  // CHANGE REQUEST GOVERNANCE ENDPOINTS
  // ============================================================================

  @Post('change-requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a maker-checker change request' })
  async createChangeRequest(@Req() req: any, @Body() dto: CreateChangeRequestDto, @Res() res: Response) {
    const user: any = req.user;
    const result = await this.mastersService.createChangeRequest(dto, user?.id);
    return this.utilService.sendSuccessResponse(res, 'Change request submitted for review', result);
  }

  @Get('change-requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of change requests' })
  @ApiQuery({ name: 'status', required: false })
  async getChangeRequests(@Query('status') status: string, @Res() res: Response) {
    const result = await this.mastersService.getChangeRequests(status);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched change requests', result);
  }

  @Post('change-requests/:id/review')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a change request (Admin only)' })
  async reviewChangeRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewChangeRequestDto,
    @Res() res: Response,
  ) {
    const user: any = req.user;
    const result = await this.mastersService.reviewChangeRequest(parseInt(id, 10), dto, user?.id);
    return this.utilService.sendSuccessResponse(res, `Change request ${dto.status.toLowerCase()}`, result);
  }

  // ============================================================================
  // UNIT CONVERSION MATRIX ENDPOINTS
  // ============================================================================

  @Get('unit-conversions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inter-unit conversion rate matrix' })
  async getUnitConversions(@Res() res: Response) {
    const result = await this.mastersService.getUnitConversions();
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched unit conversion matrix', result);
  }

  @Post('unit-conversions')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new unit conversion rate entry (Admin only)' })
  async createUnitConversion(@Req() req: any, @Body() dto: CreateUnitConversionDto, @Res() res: Response) {
    const user: any = req.user;
    const result = await this.mastersService.createUnitConversion(dto, user?.id);
    return this.utilService.sendSuccessResponse(res, 'Successfully created unit conversion entry', result);
  }

  @Put('unit-conversions/:id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a unit conversion rate entry (Admin only)' })
  async updateUnitConversion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUnitConversionDto,
    @Res() res: Response,
  ) {
    const user: any = req.user;
    const result = await this.mastersService.updateUnitConversion(parseInt(id, 10), dto, user?.id);
    return this.utilService.sendSuccessResponse(res, 'Successfully updated unit conversion entry', result);
  }

  @Delete('unit-conversions/:id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a unit conversion rate entry (Admin only)' })
  async deleteUnitConversion(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const user: any = req.user;
    await this.mastersService.deleteUnitConversion(parseInt(id, 10), user?.id);
    return this.utilService.sendSuccessResponse(res, 'Successfully deactivated unit conversion entry', null);
  }

  @Get('unit-conversions/convert')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate inter-unit conversion' })
  @ApiQuery({ name: 'amount', required: true })
  @ApiQuery({ name: 'fromUnitCode', required: true })
  @ApiQuery({ name: 'toUnitCode', required: true })
  async convertUnit(
    @Query('amount') amount: string,
    @Query('fromUnitCode') fromUnitCode: string,
    @Query('toUnitCode') toUnitCode: string,
    @Res() res: Response,
  ) {
    const parsedAmount = parseFloat(amount || '0');
    const result = await this.mastersService.convertUnit(parsedAmount, fromUnitCode, toUnitCode);
    if (!result) {
      return this.utilService.sendErrorResponse(res, `No direct or inverse conversion rule found from ${fromUnitCode} to ${toUnitCode}`);
    }
    return this.utilService.sendSuccessResponse(res, 'Successfully calculated unit conversion', result);
  }
}
