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
import { AiService } from './ai.service';

@ApiTags('AI Platform')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly utilService: UtilService,
  ) {}

  @Post('suggest/category')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '1. Categorization: Predict GHG Category & Scope from description text' })
  async categorizeDescription(@Body('description') description: string, @Res() res: Response) {
    const result = await this.aiService.categorizeDescription(description);
    return this.utilService.sendSuccessResponse(res, 'Successfully categorized description', result);
  }

  @Post('suggest/unit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '2. Unit Detection: Detect amount and unit from natural language text' })
  async detectUnit(@Body('text') text: string, @Res() res: Response) {
    const result = await this.aiService.detectUnit(text);
    return this.utilService.sendSuccessResponse(res, 'Successfully detected unit and amount', result);
  }

  @Post('suggest/factor')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '3. Factor Recommendation: Recommend best emission factor source' })
  async recommendFactor(
    @Body('category') category: string,
    @Body('fuelType') fuelType: string,
    @Body('unit') unit: string,
    @Res() res: Response,
  ) {
    const result = await this.aiService.recommendFactor(category, fuelType, unit);
    return this.utilService.sendSuccessResponse(res, 'Successfully recommended emission factor', result);
  }

  @Post('summarize/report')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '4. Report Summarization: Generate plain-language executive summary' })
  async summarizeReport(
    @Body('reportTitle') reportTitle: string,
    @Body('period') period: string,
    @Body('totalEmissions') totalEmissions: number,
    @Res() res: Response,
  ) {
    const result = await this.aiService.summarizeReport(reportTitle, period, totalEmissions);
    return this.utilService.sendSuccessResponse(res, 'Successfully generated report summary', result);
  }

  @Post('chat')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '5. Chat Assistant: Conversational Q&A against ESG data' })
  async chatAssistant(
    @Body('message') message: string,
    @Body('context') context: any,
    @Res() res: Response,
  ) {
    const result = await this.aiService.chatAssistant(message, context);
    return this.utilService.sendSuccessResponse(res, 'Successfully generated chat response', result);
  }

  @Get('anomalies')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '6. Anomaly Detection: Detect statistical outliers in organization activities' })
  @ApiQuery({ name: 'organizationId', required: false })
  async detectAnomalies(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const result = await this.aiService.detectAnomalies(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully detected anomalies', result);
  }

  @Get('duplicates')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '7. Duplicate Detection: Detect potential duplicate inventory entries' })
  @ApiQuery({ name: 'organizationId', required: false })
  async detectDuplicates(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : 1;
    const result = await this.aiService.detectDuplicates(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully detected duplicates', result);
  }

  @Post('confidence')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '8. Confidence Scoring: Compute AI confidence score for activity entry' })
  async evaluateConfidence(@Body() entryData: any, @Res() res: Response) {
    const result = await this.aiService.evaluateConfidence(entryData);
    return this.utilService.sendSuccessResponse(res, 'Successfully evaluated confidence score', result);
  }
}
