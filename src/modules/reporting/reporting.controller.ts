import {
  Controller,
  Get,
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
import { ReportingService } from './reporting.service';
import {
  GetBreakdownQueryDto,
  GetReconciliationQueryDto,
} from 'src/dto/reporting.dto';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';

@ApiTags('Reporting')
@Controller('reporting')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly utilService: UtilService,
  ) {}

  @Get('reconciliation')
  @ApiOperation({
    summary:
      'Organization total = Scope 1 + selected Scope 2 basis + Scope 3 (approved only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched reconciliation report',
  })
  async reconciliation(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query() query: GetReconciliationQueryDto,
  ) {
    const logger = this.utilService.createLogger(
      ReportingController.name,
      req,
    );
    logger.info('Method started: reconciliation');
    try {
      const result = await this.reportingService.reconciliation(user, {
        reportingYear: query.reportingYear,
        organizationId: query.organizationId,
        facility: query.facility,
      });
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched reconciliation report',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch reconciliation report. Please try again later.',
      );
    }
  }

  @Get('breakdown')
  @ApiOperation({
    summary:
      'Drill-down: total → scope → category/source → activity record → factor → GWP → calculation version',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched breakdown report',
  })
  async breakdown(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query() query: GetBreakdownQueryDto,
  ) {
    const logger = this.utilService.createLogger(
      ReportingController.name,
      req,
    );
    logger.info('Method started: breakdown');
    try {
      const result = await this.reportingService.breakdown(user, {
        reportingYear: query.reportingYear,
        organizationId: query.organizationId,
        scopeNumber: query.scopeNumber,
        category: query.category,
        facility: query.facility,
      });
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched breakdown report',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch breakdown report. Please try again later.',
      );
    }
  }

  @Get('methodology-disclosure')
  @ApiOperation({
    summary:
      'Methodology disclosure: standard/version, boundary, factor source, GWP set, engine version, data quality, exclusions',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched methodology disclosure',
  })
  async methodologyDisclosure(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query() query: GetReconciliationQueryDto,
  ) {
    const logger = this.utilService.createLogger(
      ReportingController.name,
      req,
    );
    logger.info('Method started: methodologyDisclosure');
    try {
      const result = await this.reportingService.methodologyDisclosure(user, {
        reportingYear: query.reportingYear,
        organizationId: query.organizationId,
      });
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched methodology disclosure',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch methodology disclosure. Please try again later.',
      );
    }
  }

  @Get('export/csv')
  @ApiOperation({
    summary: 'Export approved calculation rows as CSV',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file downloaded',
  })
  async exportCsv(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query() query: GetBreakdownQueryDto,
  ) {
    const logger = this.utilService.createLogger(
      ReportingController.name,
      req,
    );
    logger.info('Method started: exportCsv');
    try {
      const { filename, csv } = await this.reportingService.exportCsv(user, {
        reportingYear: query.reportingYear,
        organizationId: query.organizationId,
        scopeNumber: query.scopeNumber,
        category: query.category,
        facility: query.facility,
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      return res.send(csv);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to export CSV. Please try again later.',
      );
    }
  }
}