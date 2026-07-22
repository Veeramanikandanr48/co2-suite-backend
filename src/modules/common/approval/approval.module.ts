import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import {
  ApprovalMatrix,
  ApprovalModules,
  UserApproval,
  UserApprovalRemarksMapping,
} from 'src/entities/approval.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserApproval,
      ApprovalModules,
      ApprovalMatrix,
      UserApprovalRemarksMapping,
    ]),
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService, UtilService],
})
export class ApprovalModule {}
