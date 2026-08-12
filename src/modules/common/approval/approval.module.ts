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
import { AuditModule } from 'src/modules/common/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserApproval,
      ApprovalModules,
      ApprovalMatrix,
      UserApprovalRemarksMapping,
    ]),
    AuditModule,
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService, UtilService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
