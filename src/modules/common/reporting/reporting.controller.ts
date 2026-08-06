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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UtilService } from 'src/utility/util/util.service';
import { ReportingService } from './reporting.service';
import { AggregationService } from './aggregation.service';
import { Roles } from 'src/auth/roles.decorator';
import { MasterRole } from 'src/enums/casl.enum';

@ApiTags('Reporting Domain')
@Controller('reports')
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly aggregationService: AggregationService,
    private readonly utilService: UtilService,
  ) {}

  @Get('definitions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report definitions/templates' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getReportDefinitions(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : undefined;
    const result = await this.reportingService.getReportDefinitions(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched report definitions', result);
  }

  @Post('definitions')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create custom report definition (Admin only)' })
  async createReportDefinition(@Body() dto: any, @Res() res: Response) {
    const result = await this.reportingService.createReportDefinition(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created report definition', result);
  }

  @Post('execute/:definitionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute a report template and render pre-aggregated output' })
  async executeReport(
    @Param('definitionId', ParseIntPipe) definitionId: number,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user?.id || 1;
    const result = await this.reportingService.executeReport(definitionId, userId);
    return this.utilService.sendSuccessResponse(res, 'Successfully executed report', result);
  }

  @Get('executions/:definitionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report execution history' })
  async getReportExecutions(
    @Param('definitionId', ParseIntPipe) definitionId: number,
    @Res() res: Response,
  ) {
    const result = await this.reportingService.getReportExecutions(definitionId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched report executions', result);
  }

  @Get('summaries')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pre-aggregated emission summaries' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'year', required: false })
  async getSummaries(
    @Query('organizationId') orgId: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const parsedYear = year ? parseInt(year, 10) : undefined;
    const result = await this.aggregationService.getSummaries(parsedOrgId, parsedYear);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched emission summaries', result);
  }
}
