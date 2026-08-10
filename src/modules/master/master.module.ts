import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterRoles, MasterApprovalStatus } from 'src/entities/master.entity';
import { MasterScope } from 'src/entities/master-scope.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { MasterUnit } from 'src/entities/master-unit.entity';
import { MasterDatasource } from 'src/entities/master-datasource.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFormula } from 'src/entities/master-formula.entity';
import { MasterController } from './master.controller';
import { UtilService } from 'src/utility/util/util.service';
import { MasterService } from './master.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MasterRoles,
      MasterApprovalStatus,
      MasterScope,
      MasterCategory,
      MasterFuel,
      MasterUnit,
      MasterDatasource,
      MasterFactorVersion,
      MasterFormula,
    ]),
  ],
  controllers: [MasterController],
  providers: [MasterService, UtilService],
  exports: [MasterService],
})
export class MasterModule {}
