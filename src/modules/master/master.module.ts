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
import { ScopeCategoryMapping } from 'src/entities/scope-category-mapping.entity';
import { CategoryDatasourceMapping } from 'src/entities/category-datasource-mapping.entity';
import { VersionFuelMapping } from 'src/entities/version-fuel-mapping.entity';
import { FuelUnitMapping } from 'src/entities/fuel-unit-mapping.entity';
import { UnitFormulaMapping } from 'src/entities/unit-formula-mapping.entity';
import { MasterController } from './master.controller';
import { UtilService } from 'src/utility/util/util.service';
import { MasterService } from './master.service';

import { FactorResolutionService } from './factor-resolution.service';

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
      ScopeCategoryMapping,
      CategoryDatasourceMapping,
      VersionFuelMapping,
      FuelUnitMapping,
      UnitFormulaMapping,
    ]),
  ],
  controllers: [MasterController],
  providers: [MasterService, FactorResolutionService, UtilService],
  exports: [MasterService, FactorResolutionService],
})
export class MasterModule {}
