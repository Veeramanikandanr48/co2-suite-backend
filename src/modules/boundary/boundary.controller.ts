import {
  Body,
  Controller,
  Delete,
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
import { BoundaryService } from './boundary.service';
import {
  CreateOrganizationBoundaryDto,
  CreateSourceInclusionDto,
  GetBoundaryQueryDto,
  ReviewSourceInclusionDto,
  UpdateOrganizationBoundaryDto,
  UpdateSourceInclusionDto,
} from 'src/dto/boundary.dto';
import { OrganizationBoundary } from 'src/entities/organization-boundary.entity';
import { SourceInclusion } from 'src/entities/source-inclusion.entity';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';

@ApiTags('Boundary')
@Controller('boundary')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BoundaryController {
  constructor(
    private readonly boundaryService: BoundaryService,
    private readonly utilService: UtilService,
  ) {}

  // ─── Organization boundaries ───────────────────────────────────────────────

  @Post('organization-boundaries')
  @ApiOperation({ summary: 'Define organizational boundary for a year' })
  @ApiResponse({
    status: 200,
    description: 'Organization boundary created successfully',
    type: OrganizationBoundary,
  })
  async createBoundary(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateOrganizationBoundaryDto,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: createBoundary');
    try {
      const result = await this.boundaryService.createBoundary(dto, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Organization boundary created successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to create organization boundary. Please try again later.',
      );
    }
  }

  @Get('organization-boundaries')
  @ApiOperation({ summary: 'List organizational boundaries' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched organization boundaries',
    type: [OrganizationBoundary],
  })
  async listBoundaries(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query() query: GetBoundaryQueryDto,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: listBoundaries');
    try {
      const result = await this.boundaryService.listBoundaries(user, query);
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organization boundaries',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch organization boundaries. Please try again later.',
      );
    }
  }

  @Get('organization-boundaries/:id')
  @ApiOperation({ summary: 'Get organization boundary by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched organization boundary',
    type: OrganizationBoundary,
  })
  async getBoundary(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: getBoundary');
    try {
      const result = await this.boundaryService.getBoundary(id, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organization boundary',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch organization boundary. Please try again later.',
      );
    }
  }

  @Put('organization-boundaries/:id')
  @ApiOperation({ summary: 'Update organizational boundary' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Organization boundary updated successfully',
    type: OrganizationBoundary,
  })
  async updateBoundary(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationBoundaryDto,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: updateBoundary');
    try {
      const result = await this.boundaryService.updateBoundary(id, dto, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Organization boundary updated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update organization boundary. Please try again later.',
      );
    }
  }

  @Delete('organization-boundaries/:id')
  @ApiOperation({ summary: 'Deactivate organization boundary' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Organization boundary deactivated successfully',
  })
  async deactivateBoundary(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: deactivateBoundary');
    try {
      const result = await this.boundaryService.deactivateBoundary(id, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Organization boundary deactivated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate organization boundary. Please try again later.',
      );
    }
  }

  // ─── Source inclusions ─────────────────────────────────────────────────────

  @Post('source-inclusions')
  @ApiOperation({ summary: 'Create or update a source inclusion decision' })
  @ApiResponse({
    status: 200,
    description: 'Source inclusion record saved successfully',
    type: SourceInclusion,
  })
  async upsertInclusion(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: CreateSourceInclusionDto,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: upsertInclusion');
    try {
      const result = await this.boundaryService.upsertInclusion(dto, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Source inclusion record saved successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to save source inclusion. Please try again later.',
      );
    }
  }

  @Get('source-inclusions')
  @ApiOperation({ summary: 'List source inclusion decisions' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched source inclusions',
    type: [SourceInclusion],
  })
  async listInclusions(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query() query: GetBoundaryQueryDto,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: listInclusions');
    try {
      const result = await this.boundaryService.listInclusions(user, query);
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched source inclusions',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch source inclusions. Please try again later.',
      );
    }
  }

  @Get('source-inclusions/:id')
  @ApiOperation({ summary: 'Get source inclusion by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched source inclusion',
    type: SourceInclusion,
  })
  async getInclusion(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: getInclusion');
    try {
      const result = await this.boundaryService.getInclusion(id, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched source inclusion',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch source inclusion. Please try again later.',
      );
    }
  }

  @Put('source-inclusions/:id')
  @ApiOperation({ summary: 'Update a source inclusion decision' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Source inclusion updated successfully',
    type: SourceInclusion,
  })
  async updateInclusion(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSourceInclusionDto,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: updateInclusion');
    try {
      const result = await this.boundaryService.updateInclusion(id, dto, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Source inclusion updated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update source inclusion. Please try again later.',
      );
    }
  }

  @Post('source-inclusions/:id/review')
  @ApiOperation({ summary: 'Review and set the inclusion decision' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Source inclusion reviewed successfully',
    type: SourceInclusion,
  })
  async reviewInclusion(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewSourceInclusionDto,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: reviewInclusion');
    try {
      const result = await this.boundaryService.reviewInclusion(id, dto, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Source inclusion reviewed successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to review source inclusion. Please try again later.',
      );
    }
  }

  @Delete('source-inclusions/:id')
  @ApiOperation({ summary: 'Deactivate a source inclusion record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Source inclusion deactivated successfully',
  })
  async deleteInclusion(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      BoundaryController.name,
      req,
    );
    logger.info('Method started: deleteInclusion');
    try {
      const result = await this.boundaryService.deleteInclusion(id, user);
      return this.utilService.sendSuccessResponse(
        res,
        'Source inclusion deactivated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate source inclusion. Please try again later.',
      );
    }
  }
}