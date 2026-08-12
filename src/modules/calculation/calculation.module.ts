import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { GwpSet } from 'src/entities/gwp-set.entity';
import { GwpValue } from 'src/entities/gwp-value.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';
import { CalculationRun } from 'src/entities/calculation-run.entity';
import { CalculationResult } from 'src/entities/calculation-result.entity';
import { MethodologyModule } from 'src/modules/methodology/methodology.module';
import { CalculationController } from './calculation.controller';
import { CalculationRunService } from './calculation-run.service';
import { CalculationPipelineService } from './calculation-pipeline.service';
import { UnitNormalizationService } from './normalization.service';
import { InventoryValidationService } from './validation.service';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmissionFactor,
      GwpSet,
      GwpValue,
      InventoryEntry,
      UnitConversion,
      CalculationRun,
      CalculationResult,
    ]),
    MethodologyModule,
  ],
  controllers: [CalculationController],
  providers: [
    CalculationRunService,
    CalculationPipelineService,
    UnitNormalizationService,
    InventoryValidationService,
    UtilService,
  ],
  exports: [
    CalculationRunService,
    CalculationPipelineService,
    UnitNormalizationService,
    InventoryValidationService,
  ],
})
export class CalculationModule {}
