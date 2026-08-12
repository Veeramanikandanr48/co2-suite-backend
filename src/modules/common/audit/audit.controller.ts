import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { UtilService } from 'src/utility/util/util.service';
import { AuditQueryDto } from 'src/dto/ghg.dto';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly utilService: UtilService,
  ) {}

  @Get('trail')
  @ApiOperation({
    summary: 'Query the audit trail (entity / action / org scoped)',
  })
  @ApiResponse({ status: 200, description: 'Successfully fetched audit trail' })
  async queryTrail(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: AuditQueryDto,
  ) {
    const logger = this.utilService.createLogger(AuditController.name, req);
    logger.info('Method started: queryTrail');
    try {
      const result = await this.auditService.query({
        entityType: query.entityType,
        entityId: query.entityId,
        action: query.action,
        page: query.page,
        limit: query.limit,
      });
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched audit trail',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch audit trail. Please try again later.',
      );
    }
  }
}
