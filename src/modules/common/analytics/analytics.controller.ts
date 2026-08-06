import {
  Body,
  Controller,
  Get,
  Post,
  Query,
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
import { Response } from 'express';
import { UtilService } from 'src/utility/util/util.service';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics Domain')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly utilService: UtilService,
  ) {}

  @Get('trends')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get historical emission trends per scope' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'year', required: false })
  async getTrends(
    @Query('organizationId') orgId: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const parsedYear = year ? parseInt(year, 10) : 2025;
    const result = await this.analyticsService.getEmissionTrends(parsedOrgId, parsedYear);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched emission trends', result);
  }

  @Get('forecast')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 12-month emission forecast projection' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getForecast(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const result = await this.analyticsService.get12MonthForecast(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched 12-month forecast', result);
  }

  @Post('simulate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run carbon reduction "what-if" simulation' })
  async runSimulation(
    @Body('organizationId') orgId: number,
    @Body('dieselReductionPercent') dieselPct: number,
    @Body('electricityReductionPercent') elecPct: number,
    @Res() res: Response,
  ) {
    const parsedOrgId = orgId || 1;
    const result = await this.analyticsService.runSimulation(parsedOrgId, dieselPct, elecPct);
    return this.utilService.sendSuccessResponse(res, 'Successfully ran reduction simulation', result);
  }

  @Get('cost-analysis')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get carbon emission cost analysis at configurable carbon price' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'carbonPrice', required: false })
  async getCostAnalysis(
    @Query('organizationId') orgId: string,
    @Query('carbonPrice') carbonPrice: string,
    @Res() res: Response,
  ) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const price = carbonPrice ? parseFloat(carbonPrice) : 85.0;
    const result = await this.analyticsService.getCostAnalysis(parsedOrgId, price);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched carbon cost analysis', result);
  }

  @Get('hotspots')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top-emitting activity hotspots ranked by contribution %' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getHotspots(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const result = await this.analyticsService.getHotspots(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched emission hotspots', result);
  }

  @Get('targets')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get target reduction tracking progress' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getTargetTracking(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const result = await this.analyticsService.getTargetTracking(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched target tracking', result);
  }
}
