import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
import { Response } from 'express';
import { UtilService } from 'src/utility/util/util.service';
import { DataQualityService } from './data-quality.service';

@ApiTags('Data Quality')
@Controller('data-quality')
export class DataQualityController {
  constructor(
    private readonly dataQualityService: DataQualityService,
    private readonly utilService: UtilService,
  ) {}

  @Post('validate/:entryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run data quality validation rules against an inventory entry' })
  @ApiResponse({ status: 200, description: 'Successfully validated inventory entry' })
  async validateEntry(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Res() res: Response,
  ) {
    const result = await this.dataQualityService.validateEntry(entryId);
    return this.utilService.sendSuccessResponse(res, 'Successfully validated entry data quality', result);
  }

  @Get('results/:entryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get data quality validation score and results for an inventory entry' })
  async getValidationResults(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Res() res: Response,
  ) {
    const result = await this.dataQualityService.getValidationResults(entryId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched data quality results', result);
  }

  @Post('supplementary-values/:entryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save dynamic supplementary form values for an inventory entry' })
  async saveSupplementaryValues(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Body() values: Array<{ fieldKey: string; value: string; fieldDefinitionId?: number }>,
    @Res() res: Response,
  ) {
    const result = await this.dataQualityService.saveSupplementaryValues(entryId, values);
    return this.utilService.sendSuccessResponse(res, 'Successfully saved supplementary values', result);
  }

  @Get('supplementary-values/:entryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dynamic supplementary form values for an inventory entry' })
  async getSupplementaryValues(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Res() res: Response,
  ) {
    const result = await this.dataQualityService.getSupplementaryValues(entryId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched supplementary values', result);
  }
}
