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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/utility/decorators/current-user.decorator';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import { MrvService } from './mrv.service';
import {
  AuditMrvEntryDto,
  BulkLockMrvDto,
  GetMrvQueueQueryDto,
  LockMrvEntryDto,
  RejectMrvEntryDto,
  SubmitMrvEntryDto,
} from './dto/mrv.dto';

@ApiTags('Services - MRV Governance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('services/mrv')
export class MrvController {
  constructor(
    private readonly mrvService: MrvService,
    private readonly utilService: UtilService,
  ) {}

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit an inventory entry for MRV review (DRAFT -> SUBMITTED)' })
  @ApiParam({ name: 'id', description: 'Inventory Entry ID' })
  @ApiResponse({ status: 200, description: 'Entry successfully submitted' })
  async submitEntry(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitMrvEntryDto,
  ) {
    const logger = this.utilService.createLogger(MrvController.name, req);
    logger.info(`Method started: submitEntry id=${id}`);
    try {
      const result = await this.mrvService.submitEntry(user, id, dto);
      return this.utilService.sendSuccessResponse(res, 'Entry submitted for MRV review', result);
    } catch (error: any) {
      logger.error('Error submitting MRV entry', error);
      return this.utilService.sendErrorResponse(res, error?.message || 'Failed to submit MRV entry');
    }
  }

  @Post(':id/audit')
  @ApiOperation({ summary: 'Audit / Verify an inventory entry (SUBMITTED -> AUDITED)' })
  @ApiParam({ name: 'id', description: 'Inventory Entry ID' })
  @ApiResponse({ status: 200, description: 'Entry successfully audited' })
  async auditEntry(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AuditMrvEntryDto,
  ) {
    const logger = this.utilService.createLogger(MrvController.name, req);
    logger.info(`Method started: auditEntry id=${id}`);
    try {
      const result = await this.mrvService.auditEntry(user, id, dto);
      return this.utilService.sendSuccessResponse(res, 'Entry successfully audited', result);
    } catch (error: any) {
      logger.error('Error auditing MRV entry', error);
      return this.utilService.sendErrorResponse(res, error?.message || 'Failed to audit MRV entry');
    }
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject an inventory entry back to DRAFT' })
  @ApiParam({ name: 'id', description: 'Inventory Entry ID' })
  @ApiResponse({ status: 200, description: 'Entry rejected to DRAFT' })
  async rejectEntry(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectMrvEntryDto,
  ) {
    const logger = this.utilService.createLogger(MrvController.name, req);
    logger.info(`Method started: rejectEntry id=${id}`);
    try {
      const result = await this.mrvService.rejectEntry(user, id, dto);
      return this.utilService.sendSuccessResponse(res, 'Entry rejected back to DRAFT', result);
    } catch (error: any) {
      logger.error('Error rejecting MRV entry', error);
      return this.utilService.sendErrorResponse(res, error?.message || 'Failed to reject MRV entry');
    }
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Apply official regulatory lock to an entry (AUDITED -> LOCKED)' })
  @ApiParam({ name: 'id', description: 'Inventory Entry ID' })
  @ApiResponse({ status: 200, description: 'Entry successfully locked' })
  async lockEntry(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LockMrvEntryDto,
  ) {
    const logger = this.utilService.createLogger(MrvController.name, req);
    logger.info(`Method started: lockEntry id=${id}`);
    try {
      const result = await this.mrvService.lockEntry(user, id, dto);
      return this.utilService.sendSuccessResponse(res, 'Regulatory lock applied to entry', result);
    } catch (error: any) {
      logger.error('Error locking MRV entry', error);
      return this.utilService.sendErrorResponse(res, error?.message || 'Failed to lock MRV entry');
    }
  }

  @Post('bulk-lock')
  @ApiOperation({ summary: 'Bulk lock multiple audited entries' })
  @ApiResponse({ status: 200, description: 'Entries bulk locked' })
  async bulkLock(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Body() dto: BulkLockMrvDto,
  ) {
    const logger = this.utilService.createLogger(MrvController.name, req);
    logger.info('Method started: bulkLock');
    try {
      const result = await this.mrvService.bulkLockEntries(user, dto);
      return this.utilService.sendSuccessResponse(res, result.message, result);
    } catch (error: any) {
      logger.error('Error bulk locking entries', error);
      return this.utilService.sendErrorResponse(res, error?.message || 'Failed to bulk lock entries');
    }
  }

  @Get(':id/audit-trail')
  @ApiOperation({ summary: 'Get immutable audit event history for an inventory entry' })
  @ApiParam({ name: 'id', description: 'Inventory Entry ID' })
  async getAuditTrail(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(MrvController.name, req);
    try {
      const result = await this.mrvService.getAuditTrail(user, id);
      return this.utilService.sendSuccessResponse(res, 'Audit trail retrieved', result);
    } catch (error: any) {
      logger.error('Error retrieving audit trail', error);
      return this.utilService.sendErrorResponse(res, error?.message || 'Failed to retrieve audit trail');
    }
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get MRV verification queue (submitted and audited entries)' })
  async getVerificationQueue(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: IDecodeUserDetails,
    @Query() query: GetMrvQueueQueryDto,
  ) {
    const logger = this.utilService.createLogger(MrvController.name, req);
    try {
      const result = await this.mrvService.getVerificationQueue(user, query);
      return this.utilService.sendSuccessResponse(res, 'Verification queue retrieved', result);
    } catch (error: any) {
      logger.error('Error retrieving verification queue', error);
      return this.utilService.sendErrorResponse(res, error?.message || 'Failed to retrieve verification queue');
    }
  }
}
