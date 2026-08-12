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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CalculationRunService } from './calculation-run.service';
import { CalculationPipelineService } from './calculation-pipeline.service';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';
import { RecalculateEntryDto } from 'src/dto/ghg.dto';

@ApiTags('Calculation')
@Controller('calculation')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CalculationController {
  constructor(
    private readonly runService: CalculationRunService,
    private readonly pipeline: CalculationPipelineService,
    private readonly utilService: UtilService,
  ) {}

  @Get('runs')
  @ApiOperation({ summary: 'List calculation runs for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched calculation runs',
  })
  async listRuns(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query('status') status?: string,
    @Query('runType') runType?: string,
  ) {
    const logger = this.utilService.createLogger(
      CalculationController.name,
      req,
    );
    logger.info('Method started: listRuns');
    try {
      const result = await this.runService.listRuns(user?.organizationId, {
        status,
        runType,
      });
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched calculation runs',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch calculation runs. Please try again later.',
      );
    }
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get a calculation run with its results' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched calculation run',
  })
  async getRun(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      CalculationController.name,
      req,
    );
    logger.info('Method started: getRun');
    try {
      const run = await this.runService.getRun(id);
      if (!run) {
        return this.utilService.sendErrorResponse(
          res,
          'Calculation run not found.',
        );
      }
      const results = await this.runService.listResults(id);
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched calculation run',
        { ...run, results },
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch calculation run. Please try again later.',
      );
    }
  }

  @Get('entries/:entryId')
  @ApiOperation({ summary: 'Get latest calculation result for an entry' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched calculation result',
  })
  async getLatestResult(
    @Req() req: Request,
    @Res() res: Response,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    const logger = this.utilService.createLogger(
      CalculationController.name,
      req,
    );
    logger.info('Method started: getLatestResult');
    try {
      const result = await this.runService.getLatestResult(entryId);
      if (!result) {
        return this.utilService.sendErrorResponse(
          res,
          'No calculation result found for this entry.',
        );
      }
      const history = await this.runService.getResultHistory(entryId);
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched calculation result',
        { latest: result, history },
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch calculation result. Please try again later.',
      );
    }
  }

  @Post('entries/:entryId/recalculate')
  @ApiOperation({
    summary: 'Re-run the pipeline for a draft entry (revisioning)',
  })
  @ApiResponse({ status: 200, description: 'Entry recalculated successfully' })
  async recalculateEntry(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('entryId', ParseIntPipe) entryId: number,
    @Body() dto: RecalculateEntryDto,
  ) {
    const logger = this.utilService.createLogger(
      CalculationController.name,
      req,
    );
    logger.info('Method started: recalculateEntry');
    try {
      const outcome = await this.pipeline.recalcEntry(entryId, {
        reason: dto.reason,
        gwpSetId: dto.gwpSetId,
      });
      if (!outcome.ok) {
        return this.utilService.sendErrorResponse(
          res,
          outcome.pipelineMessage ?? 'Recalculation failed.',
        );
      }
      return this.utilService.sendSuccessResponse(
        res,
        'Entry recalculated successfully',
        outcome,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to recalculate. Please try again later.',
      );
    }
  }
}
