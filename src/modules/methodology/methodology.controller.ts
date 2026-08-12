import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { MethodologyService } from './methodology.service';
import { FactorResolutionService } from './factor-resolution.service';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';
import {
  CreateEmissionFactorDto,
  CreateGwpSetDto,
  CreateUnitConversionDto,
} from 'src/dto/ghg.dto';

@ApiTags('Methodology')
@Controller('methodology')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MethodologyController {
  constructor(
    private readonly methodologyService: MethodologyService,
    private readonly factorResolutionService: FactorResolutionService,
    private readonly utilService: UtilService,
  ) {}

  // ─── GWP Sets ──────────────────────────────────────────────────────────────

  @Get('gwp-sets')
  @ApiOperation({ summary: 'Get all active GWP sets with per-gas values' })
  @ApiResponse({ status: 200, description: 'Successfully fetched GWP sets' })
  async getGwpSets(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: getGwpSets');
    try {
      const result = await this.methodologyService.getGwpSets();
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched GWP sets',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch GWP sets. Please try again later.',
      );
    }
  }

  @Get('gwp-sets/current')
  @ApiOperation({ summary: 'Get the currently active GWP set' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched current GWP set',
  })
  async getCurrentGwpSet(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: getCurrentGwpSet');
    try {
      const result = await this.methodologyService.getCurrentGwpSet();
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched current GWP set',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch current GWP set. Please try again later.',
      );
    }
  }

  @Post('gwp-sets')
  @ApiOperation({ summary: 'Create or update a GWP set (with values)' })
  @ApiResponse({ status: 200, description: 'GWP set saved successfully' })
  async upsertGwpSet(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateGwpSetDto,
  ) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: upsertGwpSet');
    try {
      const result = await this.methodologyService.upsertGwpSet(dto, user?.id);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'GWP set saved successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        error?.message ?? 'Failed to save GWP set.',
      );
    }
  }

  @Delete('gwp-sets/:id')
  @ApiOperation({ summary: 'Deactivate a GWP set' })
  @ApiResponse({ status: 200, description: 'GWP set deactivated successfully' })
  async deleteGwpSet(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: deleteGwpSet');
    try {
      await this.methodologyService.deleteGwpSet(id);
      return this.utilService.sendSuccessResponse(
        res,
        'GWP set deactivated successfully',
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate GWP set. Please try again later.',
      );
    }
  }

  // ─── Emission Factors ──────────────────────────────────────────────────────

  @Get('factors')
  @ApiOperation({
    summary: 'Get all active emission factors with full identity',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched emission factors',
  })
  async getEmissionFactors(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: getEmissionFactors');
    try {
      const result = await this.methodologyService.getEmissionFactors();
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
    }
  }

  @Post('factors')
  @ApiOperation({ summary: 'Create or update an emission factor' })
  @ApiResponse({
    status: 200,
    description: 'Emission factor saved successfully',
  })
  async upsertEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateEmissionFactorDto,
  ) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: upsertEmissionFactor');
    try {
      const result = await this.methodologyService.upsertEmissionFactor(
        dto,
        user?.id,
      );
      return this.utilService.sendSuccessResponse(
        res,
        'Emission factor saved successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        error?.message ?? 'Failed to save emission factor.',
      );
    }
  }

  @Delete('factors/:id')
  @ApiOperation({ summary: 'Deactivate an emission factor' })
  @ApiResponse({
    status: 200,
    description: 'Emission factor deactivated successfully',
  })
  async deleteEmissionFactor(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: deleteEmissionFactor');
    try {
      await this.methodologyService.deleteEmissionFactor(id);
      return this.utilService.sendSuccessResponse(
        res,
        'Emission factor deactivated successfully',
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate emission factor. Please try again later.',
      );
    }
  }

  // ─── Unit Conversions ──────────────────────────────────────────────────────

  @Get('unit-conversions')
  @ApiOperation({ summary: 'Get all active unit conversions' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched unit conversions',
  })
  async getUnitConversions(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: getUnitConversions');
    try {
      const result = await this.methodologyService.getUnitConversions();
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched unit conversions',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch unit conversions. Please try again later.',
      );
    }
  }

  @Post('unit-conversions')
  @ApiOperation({ summary: 'Create or update a unit conversion' })
  @ApiResponse({
    status: 200,
    description: 'Unit conversion saved successfully',
  })
  async upsertUnitConversion(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateUnitConversionDto,
  ) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: upsertUnitConversion');
    try {
      const result = await this.methodologyService.upsertUnitConversion(
        dto,
        user?.id,
      );
      return this.utilService.sendSuccessResponse(
        res,
        'Unit conversion saved successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        error?.message ?? 'Failed to save unit conversion.',
      );
    }
  }

  @Delete('unit-conversions/:id')
  @ApiOperation({ summary: 'Deactivate a unit conversion' })
  @ApiResponse({
    status: 200,
    description: 'Unit conversion deactivated successfully',
  })
  async deleteUnitConversion(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      MethodologyController.name,
      req,
    );
    logger.info('Method started: deleteUnitConversion');
    try {
      await this.methodologyService.deleteUnitConversion(id);
      return this.utilService.sendSuccessResponse(
        res,
        'Unit conversion deactivated successfully',
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate unit conversion. Please try again later.',
      );
    }
  }
}
