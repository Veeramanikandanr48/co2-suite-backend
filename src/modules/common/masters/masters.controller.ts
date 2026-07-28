import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MastersService } from './masters.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IResponse } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';

@Controller('masters')
export class MastersController {
  constructor(
    private readonly mastersService: MastersService,
    private readonly utilService: UtilService,
  ) {}

  @Get('getMasterRoles')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getMasterRoles(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    logger.info('Method Start: getMasterRoles');
    try {
      const masterData = await this.mastersService.getMasterRoles();
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched master roles',
        masterData,
      );
    } catch (error) {
      logger.error(`Error in getMasterRoles: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Error in fetching master roles');
    } finally {
      logger.info('Method end: getMasterRoles');
      res.end();
    }
  }

  @Get('getMasterApprovalStatuses')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getMasterApprovalStatuses(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    logger.info('Method Start: getMasterApprovalStatuses');
    try {
      const masterData = await this.mastersService.getMasterApprovalStatuses();
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched master approval statuses',
        masterData,
      );
    } catch (error) {
      logger.error(`Error in getMasterApprovalStatuses: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Error in fetching approval statuses');
    } finally {
      logger.info('Method end: getMasterApprovalStatuses');
      res.end();
    }
  }
}
