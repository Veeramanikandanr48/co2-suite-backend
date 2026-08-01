import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { UserId } from 'src/utility/decorators/userid.decorator';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';
import {
  CheckApprovalAccessDto,
  GetApprovalDetailsDto,
  GetNextApprovarDetailsDto,
  UpdateUserApprovalDto,
} from 'src/modules/common/approval/dto/approval.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentRoleId } from 'src/utility/decorators/current-role.decorator';

@Controller('approval')
@ApiTags('Approval')
export class ApprovalController {
  constructor(
    private readonly approvalService: ApprovalService,
    private readonly utilService: UtilService,
  ) {}

  @Post('getNextApproverDetails')
  @Post('getNextApprovarDetails')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get next approver details' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved next approver details',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to retrieve next approver details',
  })
  async getNextApprovarDetails(
    @Body() body: GetNextApprovarDetailsDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const logger = this.utilService.createLogger(ApprovalController.name, req);
    logger.info('Method started: getNextApprovarDetails');
    try {
      const result = await this.approvalService.getNextApprovarDetails(
        body.approvalModuleUniqueId,
        body.approvalModuleId,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully retrieved next approver details',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to retrieve next approver details. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getNextApprovarDetails');
    }
  }

  @Post('getApprovalDetails')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get approval details' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved approval details',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to retrieve approval details',
  })
  async getApprovalDetails(
    @Body() body: GetApprovalDetailsDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const logger = this.utilService.createLogger(ApprovalController.name, req);
    logger.info('Method started: getApprovalDetails');
    try {
      const result = await this.approvalService.getApprovalDetails(
        body.approvalModuleUniqueId,
        body.approvalModuleId,
        body.toRoleId,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully retrieved approval details',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to retrieve approval details. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getApprovalDetails');
    }
  }

  @Post('checkApprovalAccess')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check approval access' })
  @ApiResponse({
    status: 200,
    description: 'Successfully checked approval access',
  })
  @ApiResponse({ status: 400, description: 'Failed to check approval access' })
  async checkApprovalAccess(
    @Body() body: CheckApprovalAccessDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const logger = this.utilService.createLogger(ApprovalController.name, req);
    logger.info('Method started: checkApprovalAccess');
    try {
      const result = await this.approvalService.checkApprovalAccess(
        body.approvalModuleId,
        body.toRoleId,
        body.approvalModuleUniqueId,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully checked approval access',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to check approval access. Please try again later.',
      );
    } finally {
      logger.info('Method ended: checkApprovalAccess');
    }
  }

  @Post('updateUserApproval')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user approval' })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated user approval',
  })
  @ApiResponse({ status: 400, description: 'Failed to update user approval' })
  async updateUserApproval(
    @Body() body: UpdateUserApprovalDto,
    @UserId() userId: number,
    @Res() res: Response,
    @Req() req: Request,
    @CurrentRoleId() currentRoleId: number,
  ) {
    const logger = this.utilService.createLogger(ApprovalController.name, req);
    logger.info('Method started: updateUserApproval');
    try {
      const result = await this.approvalService.updateUserApproval(
        {
          approvalModuleUniqueId: body.approvalModuleUniqueId,
          approvalModuleId: body.approvalModuleId,
          approvalStatusId: body.approvalStatusId,
          reason: body.reason,
          userId,
          logger,
          userRoleId: currentRoleId,
          isRoleApproval: false,
        },
        logger,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully updated user approval',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update user approval. Please try again later.',
      );
    } finally {
      logger.info('Method ended: updateUserApproval');
    }
  }
}
