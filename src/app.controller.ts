import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { UtilService } from './utility/util/util.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly utilService: UtilService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  async getHello(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(AppController.name, req);
    logger.info('Method started: getHello');
    try {
      const result = this.appService.getHello();
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Service is running',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Service is temporarily unavailable',
      );
    } finally {
      logger.info('Method ended: getHello');
    }
  }
}
