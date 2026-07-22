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
import { ApiTags } from '@nestjs/swagger';
import {
  ApprovalAccessResult,
  IApprovalData,
} from 'src/interfaces/approval.interface';
import { ApprovalStatusEnum } from 'src/enums/approval.enum';
import { UserDetails } from 'src/entities/user.entity';
import { CurrentRoleId } from 'src/utility/decorators/current-role.decorator';

@Controller('approval')
@ApiTags('Approval')
export class ApprovalController {
  constructor(
    private readonly approvalService: ApprovalService,
    private readonly utilService: UtilService,
  ) {}

  @Post('getNextApprovarDetails')
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
      this.utilService.sendSuccessResponse(
        res,
        'Successfully retrieved next approver details',
        result,
      );
    } catch (error) {
      logger.error(
        `Error in getNextApprovarDetails: ${error.message}`,
        error.stack,
      );
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: getNextApprovarDetails`);
    }
  }

  @Post('getApprovalDetails')
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
      this.utilService.sendSuccessResponse(
        res,
        'Successfully retrieved approval details',
        result,
      );
    } catch (error) {
      logger.error(
        `Error in getApprovalDetails: ${error.message}`,
        error.stack,
      );
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info(`Method end: getApprovalDetails`);
    }
  }

  @Post('checkApprovalAccess')
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

      this.utilService.sendSuccessResponse(
        res,
        'Successfully checked approval access',
        result,
      );
    } catch (error) {
      logger.error(
        `Error in checkApprovalAccess: ${error.message}`,
        error.stack,
      );
      this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Post('updateUserApproval')
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
          // Update the approval module status to approved in the master table
        }
      } else {
      }

      this.utilService.sendSuccessResponse(
        res,
        'Successfully updated user approval',
        result,
      );
    } catch (error) {
      logger.error(
        `Error in updateUserApproval: ${error.message}`,
        error.stack,
      );
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      await queryRunner.release();
      logger.info(`Releasing query runner`);
      logger.info(`Method end: updateUserApproval`);
    }
  }
}
