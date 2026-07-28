import { Module } from '@nestjs/common';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';
import { UtilService } from 'src/utility/util/util.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MasterApprovalStatus,
  MasterRoles,
} from 'src/entities/master.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MasterRoles,
      MasterApprovalStatus,
    ]),
  ],
  controllers: [MastersController],
  providers: [MastersService, UtilService],
})
export class MastersModule {}
