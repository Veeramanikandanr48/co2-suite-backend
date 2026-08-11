import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterRoles, MasterApprovalStatus } from 'src/entities/master.entity';
import { MasterScope } from 'src/entities/master-scope.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { MasterActivityType } from 'src/entities/master-activity-type.entity';
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

// v2 Entities
import { MasterGeography } from 'src/entities/master-geography.entity';
import { OrganizationalBoundary } from 'src/entities/organizational-boundary.entity';
import { BoundaryFacility } from 'src/entities/boundary-facility.entity';
import { Asset } from 'src/entities/asset.entity';
import { MasterCalculationMethod } from 'src/entities/master-calculation-method.entity';
import { ActivityTypeMethod } from 'src/entities/activity-type-method.entity';
import { MasterUnitDimension } from 'src/entities/master-unit-dimension.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';
import { ActivityInputDefinition } from 'src/entities/activity-input-definition.entity';
import { FactorDatasetVersion } from 'src/entities/factor-dataset-version.entity';
import { MasterEnergyType } from 'src/entities/master-energy-type.entity';
import { MasterGas } from 'src/entities/master-gas.entity';
import { GwpAssessment } from 'src/entities/gwp-assessment.entity';
import { MasterGWP } from 'src/entities/master-gwp.entity';
import { MasterRefrigerant } from 'src/entities/master-refrigerant.entity';
import { RefrigerantComponent } from 'src/entities/refrigerant-component.entity';
import { SourceDocument } from 'src/entities/source-document.entity';
import { EvidenceCitation } from 'src/entities/evidence-citation.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { EmissionFactorComponent } from 'src/entities/emission-factor-component.entity';
import { InventoryActivity } from 'src/entities/inventory-activity.entity';
import { ActivityInput } from 'src/entities/activity-input.entity';
import { ActivitySource } from 'src/entities/activity-source.entity';
import { Vehicle } from 'src/entities/vehicle.entity';
import { CombustionEquipment } from 'src/entities/combustion-equipment.entity';
import { RefrigerationEquipment } from 'src/entities/refrigeration-equipment.entity';
import { FugitiveMeasurement } from 'src/entities/fugitive-measurement.entity';
import { EnergySupplyContract } from 'src/entities/energy-supply-contract.entity';
import { PurchasedEnergyActivity } from 'src/entities/purchased-energy-activity.entity';
import { EnergyAttributeInstrument } from 'src/entities/energy-attribute-instrument.entity';
import { Scope3Activity } from 'src/entities/scope3-activity.entity';
import { BusinessTravelDetail } from 'src/entities/business-travel-detail.entity';
import { EmployeeCommutingDetail } from 'src/entities/employee-commuting-detail.entity';
import { TransportDetail } from 'src/entities/transport-detail.entity';
import { WasteDetail } from 'src/entities/waste-detail.entity';
import { CalculationRun } from 'src/entities/calculation-run.entity';
import { CalculationInputSnapshot } from 'src/entities/calculation-input-snapshot.entity';
import { CalculationFactorSnapshot } from 'src/entities/calculation-factor-snapshot.entity';
import { CalculationGasResult } from 'src/entities/calculation-gas-result.entity';
import { CalculationResult } from 'src/entities/calculation-result.entity';
import { InventoryReport } from 'src/entities/inventory-report.entity';
import { ReportLine } from 'src/entities/report-line.entity';

import { MasterController } from './master.controller';
import { UtilService } from 'src/utility/util/util.service';
import { MasterService } from './master.service';

import { FactorResolutionService } from './factor-resolution.service';
import { UnitNormalizationService } from './unit-normalization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MasterRoles,
      MasterApprovalStatus,
      MasterScope,
      MasterCategory,
      MasterActivityType,
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

      // v2 Core Entities
      MasterGeography,
      OrganizationalBoundary,
      BoundaryFacility,
      Asset,
      MasterCalculationMethod,
      ActivityTypeMethod,
      MasterUnitDimension,
      UnitConversion,
      ActivityInputDefinition,
      FactorDatasetVersion,
      MasterEnergyType,
      MasterGas,
      GwpAssessment,
      MasterGWP,
      MasterRefrigerant,
      RefrigerantComponent,
      SourceDocument,
      EvidenceCitation,
      EmissionFactor,
      EmissionFactorComponent,
      InventoryActivity,
      ActivityInput,
      ActivitySource,
      Vehicle,
      CombustionEquipment,
      RefrigerationEquipment,
      FugitiveMeasurement,
      EnergySupplyContract,
      PurchasedEnergyActivity,
      EnergyAttributeInstrument,
      Scope3Activity,
      BusinessTravelDetail,
      EmployeeCommutingDetail,
      TransportDetail,
      WasteDetail,
      CalculationRun,
      CalculationInputSnapshot,
      CalculationFactorSnapshot,
      CalculationGasResult,
      CalculationResult,
      InventoryReport,
      ReportLine,
    ]),
  ],
  controllers: [MasterController],
  providers: [
    MasterService,
    FactorResolutionService,
    UnitNormalizationService,
    UtilService,
  ],
  exports: [MasterService, FactorResolutionService, UnitNormalizationService],
})
export class MasterModule {}
