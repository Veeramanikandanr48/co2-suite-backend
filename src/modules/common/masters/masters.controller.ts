import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { MastersService } from './masters.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';

@ApiTags('Masters')
@Controller('masters')
export class MastersController {
  constructor(
    private readonly mastersService: MastersService,
    private readonly utilService: UtilService,
  ) {}

  @Get('getMasterRoles')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get master roles' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched master roles',
  })
  async getMasterRoles(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    logger.info('Method started: getMasterRoles');
    try {
      const result = await this.mastersService.getMasterRoles();
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched master roles',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch master roles',
      );
    } finally {
      logger.info('Method ended: getMasterRoles');
    }
  }

  @Get('getMasterApprovalStatuses')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get master approval statuses' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched master approval statuses',
  })
  async getMasterApprovalStatuses(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    logger.info('Method started: getMasterApprovalStatuses');
    try {
      const result = await this.mastersService.getMasterApprovalStatuses();
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched master approval statuses',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch approval statuses',
      );
    } finally {
      logger.info('Method ended: getMasterApprovalStatuses');
    }
  }
}
