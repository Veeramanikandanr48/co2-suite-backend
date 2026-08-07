import { Module } from '@nestjs/common';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';
import { UtilService } from 'src/utility/util/util.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterApprovalStatus, MasterRoles } from 'src/entities/master.entity';
import { MasterItem } from 'src/entities/master-item.entity';
import { MasterItemVersion } from 'src/entities/master-item-version.entity';
import { MasterSchema } from 'src/entities/master-schema.entity';
import { MasterChangeRequest } from 'src/entities/master-change-request.entity';
import { ImportJob, ImportJobError } from 'src/entities/import-job.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import {
  CalculationPolicy,
  EmissionFactorRow,
  EmissionFactorSet,
  EmissionFactorValue,
  FormulaLibrary,
  FormulaVersion,
  GasMultiplier,
  GasType,
  GwpVersion,
  NotificationTemplate,
  SupplementaryFieldDefinition,
} from 'src/entities/master-config.entity';

import { Service } from 'src/entities/service.entity';
import { ServiceDomain } from 'src/entities/service-domain.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { MasterType } from 'src/entities/master-type.entity';
import { MasterTypeSchemaVersion } from 'src/entities/master-type-schema-version.entity';
import { MasterTypeStatistics } from 'src/entities/master-type-statistics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ServiceDomain,
      MasterCategory,
      MasterType,
      MasterTypeSchemaVersion,
      MasterTypeStatistics,
      MasterRoles,
      MasterApprovalStatus,
      MasterItem,
      MasterItemVersion,
      MasterSchema,
      MasterChangeRequest,
      ImportJob,
      ImportJobError,
      UnitConversion,
      EmissionFactor,
      ServiceScopeItem,
      GasType,
      GwpVersion,
      GasMultiplier,
      EmissionFactorSet,
      EmissionFactorRow,
      EmissionFactorValue,
      FormulaLibrary,
      FormulaVersion,
      CalculationPolicy,
      SupplementaryFieldDefinition,
      NotificationTemplate,
    ]),
  ],
  controllers: [MastersController],
  providers: [MastersService, UtilService],
  exports: [MastersService],
})
export class MastersModule { }
