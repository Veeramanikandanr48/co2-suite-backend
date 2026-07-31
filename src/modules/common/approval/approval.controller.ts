import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { UserId } from 'src/utility/decorators/userid.decorator';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';
import {
  CheckApprovalAccessDto,
  GetApprovalDetailsDto,
  GetNextApprovarDetailsDto,
  UpdateUserApprovalDto,
} from 'src/modules/common/approval/dto/apprroval.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ApprovalAccessResult,
  IApprovalData,
} from 'src/interfaces/approval.interface';
import { ApprovalStatusEnum } from 'src/enums/approval.enum';
import { CurrentRoleId } from 'src/utility/decorators/current-role.decorator';

@Controller('approval')
@ApiTags('Approval')
export class ApprovalController {
  constructor(
    private readonly approvalService: ApprovalService,
    private readonly utilService: UtilService,
  ) {}

  @Post('getNextApprovarDetails')
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
    @UserId() userId: number,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const logger = this.utilService.createLogger(ApprovalController.name, req);
    try {
      logger.info(`Method started: getNextApprovarDetails`);
      const result = await this.approvalService.getNextApprovarDetails(
        body.approvalModuleUniqueId,
        body.approvalModuleId,
      );
      logger.info('Operation successful');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully retrieved next approver details',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      this.utilService.sendErrorResponse(
        res,
        'Failed to retrieve next approver details. Please try again later.',
      );
    } finally {
      logger.info(`Method end: getNextApprovarDetails`);
    }
  }

  @Post('getApprovalDetails')
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
    @UserId() userId: number,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const logger = this.utilService.createLogger(ApprovalController.name, req);
    try {
      logger.info(`Method started: getApprovalDetails`);
      const result = await this.approvalService.getApprovalDetails(
        body.approvalModuleUniqueId,
        body.approvalModuleId,
        body.toRoleId,
      );
      logger.info('Operation successful');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully retrieved approval details',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      this.utilService.sendErrorResponse(
        res,
        'Failed to retrieve approval details. Please try again later.',
      );
    } finally {
      logger.info(`Method end: getApprovalDetails`);
    }
  }

  @Post('checkApprovalAccess')
  @ApiOperation({ summary: 'Check approval access' })
  @ApiResponse({
    status: 200,
    description: 'Successfully checked approval access',
  })
  @ApiResponse({ status: 400, description: 'Failed to check approval access' })
  async checkApprovalAccess(
    @Body() body: CheckApprovalAccessDto,
    @UserId() userId: number,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const logger = this.utilService.createLogger(ApprovalController.name, req);
    try {
      logger.info(`Method started: checkApprovalAccess`);
      const serviceResult = await this.approvalService.checkApprovalAccess(
        body.approvalModuleId,
        body.toRoleId,
        body.approvalModuleUniqueId,
      );
      const result: ApprovalAccessResult = {
        hasAccess: Boolean(serviceResult?.hasAccess),
        message: serviceResult?.hasAccess
          ? 'You have access to approve this action.'
          : 'You do not have access to approve this action.',
      };
      logger.info('Operation successful');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully checked approval access',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      this.utilService.sendErrorResponse(
        res,
        'Failed to check approval access. Please try again later.',
      );
    } finally {
      logger.info(`Method end: checkApprovalAccess`);
    }
  }

  @Post('updateUserApproval')
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
    const queryRunner = await this.utilService.connectQueryRunner();
    try {
      logger.info(`Method started: updateUserApproval`);
      const approvalData: IApprovalData = {
        approvalModuleUniqueId: body.approvalModuleUniqueId,
        approvalModuleId: body.approvalModuleId,
        approvalStatusId: body.approvalStatusId,
        reason: body.reason,
        userId,
        logger,
        userRoleId: currentRoleId,
        isRoleApproval: false,
      };

      const result =
        await this.approvalService.updateUserApprovalWithQueryRunner(
          approvalData,
          queryRunner,
        );
      if (!result) {
        await queryRunner.rollbackTransaction();
        logger.info(
          `Rolling back transaction due to error in updating user approval`,
        );
        logger.error(`Error in updating user approval`);
        this.utilService.sendErrorResponse(
          res,
          'Error in updating user approval',
        );
        return;
      }
      await queryRunner.commitTransaction();
      logger.info(`Committing transaction`);

      if (body.approvalStatusId == ApprovalStatusEnum.APPROVE) {
        const nextApprovalDetail =
          await this.approvalService.getNextApprovarDetails(
            body.approvalModuleUniqueId,
            body.approvalModuleId,
          );
        if (!nextApprovalDetail) {
          logger.info(`No next approver found`);
        }
      }

      logger.info('Operation successful');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully updated user approval',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      this.utilService.sendErrorResponse(
        res,
        'Failed to update user approval. Please try again later.',
      );
    } finally {
      await queryRunner.release();
      logger.info(`Releasing query runner`);
      logger.info(`Method end: updateUserApproval`);
    }
  }
}
