import {
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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto, UpdateFacilityDto } from 'src/dto/facility.dto';
import { UtilService } from 'src/utility/util/util.service';
import { Facility } from 'src/entities/facility.entity';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@ApiTags('Facilities')
@Controller('facilities')
export class FacilitiesController {
  constructor(
    private readonly facilitiesService: FacilitiesService,
    private readonly utilService: UtilService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new facility (Super Admin & Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Facility created successfully',
    type: Facility,
  })
  @ApiResponse({ status: 400, description: 'Failed to create facility' })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateFacilityDto,
  ) {
    const logger = this.utilService.createLogger(
      FacilitiesController.name,
      req,
    );
    logger.info('Method started: create');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.facilitiesService.createFacility(dto, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Facility created successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to create facility. Please try again later.',
      );
    } finally {
      logger.info('Method ended: create');
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active facilities' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched facilities',
    type: [Facility],
  })
  @ApiResponse({ status: 400, description: 'Failed to fetch facilities' })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('orgId') orgId?: number,
  ) {
    const logger = this.utilService.createLogger(
      FacilitiesController.name,
      req,
    );
    logger.info('Method started: findAll');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.facilitiesService.getAllFacilities(
        user,
        orgId ? Number(orgId) : undefined,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched facilities',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch facilities. Please try again later.',
      );
    } finally {
      logger.info('Method ended: findAll');
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get facility by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched facility',
    type: Facility,
  })
  @ApiResponse({ status: 400, description: 'Failed to fetch facility' })
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      FacilitiesController.name,
      req,
    );
    logger.info('Method started: findOne');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.facilitiesService.getFacilityById(id, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched facility',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch facility. Please try again later.',
      );
    } finally {
      logger.info('Method ended: findOne');
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update facility (Super Admin & Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Facility updated successfully',
    type: Facility,
  })
  @ApiResponse({ status: 400, description: 'Failed to update facility' })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacilityDto,
  ) {
    const logger = this.utilService.createLogger(
      FacilitiesController.name,
      req,
    );
    logger.info('Method started: update');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.facilitiesService.updateFacility(id, dto, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Facility updated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update facility. Please try again later.',
      );
    } finally {
      logger.info('Method ended: update');
    }
  }

  @Post(':id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate facility (Super Admin & Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Facility deactivated successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to deactivate facility' })
  async deactivate(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      FacilitiesController.name,
      req,
    );
    logger.info('Method started: deactivate');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.facilitiesService.deactivateFacility(id, user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Facility deactivated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate facility. Please try again later.',
      );
    } finally {
      logger.info('Method ended: deactivate');
    }
  }
}
