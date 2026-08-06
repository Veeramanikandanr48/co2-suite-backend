import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MasterApprovalStatus, MasterRoles } from 'src/entities/master.entity';
import { MasterItem, MasterItemStatus, MasterItemType } from 'src/entities/master-item.entity';
import { MasterItemVersion } from 'src/entities/master-item-version.entity';
import { MasterSchema } from 'src/entities/master-schema.entity';
import { ChangeRequestStatus, MasterChangeRequest } from 'src/entities/master-change-request.entity';
import { ImportJob, ImportJobError, ImportJobStatus } from 'src/entities/import-job.entity';
import { PhysicalDimension, UnitConversion } from 'src/entities/unit-conversion.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
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
import { Repository } from 'typeorm';
import {
  SEED_GAS_TYPES,
  SEED_GWP_VERSIONS,
  SEED_GAS_MULTIPLIERS,
  SEED_FORMULA_LIBRARIES,
  SEED_SUPPLEMENTARY_FIELDS,
} from 'src/seeds/master-config.seed';
import {
  BulkImportMasterItemsDto,
  CreateCalculationPolicyDto,
  CreateChangeRequestDto,
  CreateEmissionFactorRowDto,
  CreateEmissionFactorSetDto,
  CreateEmissionFactorValueDto,
  CreateFormulaLibraryDto,
  CreateGasMultiplierDto,
  CreateGasTypeDto,
  CreateGwpVersionDto,
  CreateMasterItemDto,
  CreateMasterSchemaDto,
  CreateSupplementaryFieldDto,
  CreateUnitConversionDto,
  ReviewChangeRequestDto,
  UpdateCalculationPolicyDto,
  UpdateEmissionFactorSetDto,
  UpdateGasTypeDto,
  UpdateMasterItemDto,
  UpdateUnitConversionDto,
} from 'src/dto/master-config.dto';

@Injectable()
export class MastersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MastersService.name);

  constructor(
    @InjectRepository(MasterRoles)
    private readonly masterRolesRepository: Repository<MasterRoles>,
    @InjectRepository(MasterApprovalStatus)
    private readonly masterApprovalStatusRepository: Repository<MasterApprovalStatus>,
    @InjectRepository(MasterItem)
    private readonly masterItemRepo: Repository<MasterItem>,
    @InjectRepository(MasterItemVersion)
    private readonly versionRepo: Repository<MasterItemVersion>,
    @InjectRepository(MasterSchema)
    private readonly schemaRepo: Repository<MasterSchema>,
    @InjectRepository(MasterChangeRequest)
    private readonly changeReqRepo: Repository<MasterChangeRequest>,
    @InjectRepository(ImportJob)
    private readonly importJobRepo: Repository<ImportJob>,
    @InjectRepository(ImportJobError)
    private readonly importJobErrorRepo: Repository<ImportJobError>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionRepo: Repository<UnitConversion>,
    @InjectRepository(EmissionFactor)
    private readonly efRepo: Repository<EmissionFactor>,
    @InjectRepository(ServiceScopeItem)
    private readonly scopeItemRepo: Repository<ServiceScopeItem>,
    @InjectRepository(GasType)
    private readonly gasTypeRepo: Repository<GasType>,
    @InjectRepository(GwpVersion)
    private readonly gwpVersionRepo: Repository<GwpVersion>,
    @InjectRepository(GasMultiplier)
    private readonly gasMultiplierRepo: Repository<GasMultiplier>,
    @InjectRepository(EmissionFactorSet)
    private readonly factorSetRepo: Repository<EmissionFactorSet>,
    @InjectRepository(EmissionFactorRow)
    private readonly factorRowRepo: Repository<EmissionFactorRow>,
    @InjectRepository(EmissionFactorValue)
    private readonly factorValueRepo: Repository<EmissionFactorValue>,
    @InjectRepository(FormulaLibrary)
    private readonly formulaLibraryRepo: Repository<FormulaLibrary>,
    @InjectRepository(FormulaVersion)
    private readonly formulaVersionRepo: Repository<FormulaVersion>,
    @InjectRepository(CalculationPolicy)
    private readonly policyRepo: Repository<CalculationPolicy>,
    @InjectRepository(SupplementaryFieldDefinition)
    private readonly suppFieldRepo: Repository<SupplementaryFieldDefinition>,
    @InjectRepository(NotificationTemplate)
    private readonly notifTemplateRepo: Repository<NotificationTemplate>,
  ) { }

  async onApplicationBootstrap() {
    try {
      await this.seedMasterConfigs();
      await this.syncAllMasterItemsToScopeItems();
    } catch (err) {
      this.logger.error('Failed to seed master configuration data', err);
    }
  }

  // ============================================================================
  // SEEDING LOGIC
  // ============================================================================

  private async seedMasterConfigs() {
    // 1. Seed Gas Types
    const gasTypeCount = await this.gasTypeRepo.count();
    if (gasTypeCount === 0) {
      this.logger.log('Seeding Gas Types...');
      await this.gasTypeRepo.save(SEED_GAS_TYPES);
    }

    // 2. Seed GWP Versions & Multipliers
    const gwpCount = await this.gwpVersionRepo.count();
    if (gwpCount === 0) {
      this.logger.log('Seeding GWP Versions & Multipliers...');
      await this.gwpVersionRepo.save(SEED_GWP_VERSIONS);

      const allGasTypes = await this.gasTypeRepo.find();
      const allGwpVersions = await this.gwpVersionRepo.find();

      const gasTypeMap = new Map(allGasTypes.map((g) => [g.code, g.id]));
      const gwpMap = new Map(allGwpVersions.map((v) => [v.code, v.id]));

      const multipliersToSave = SEED_GAS_MULTIPLIERS.map((m) => ({
        gwpVersionId: gwpMap.get(m.gwpVersionCode),
        gasTypeId: gasTypeMap.get(m.gasTypeCode),
        multiplier: m.multiplier,
      })).filter((m) => m.gwpVersionId && m.gasTypeId);

      if (multipliersToSave.length > 0) {
        await this.gasMultiplierRepo.save(multipliersToSave);
      }
    }

    // 3. Seed Formula Library
    const formulaCount = await this.formulaLibraryRepo.count();
    if (formulaCount === 0) {
      this.logger.log('Seeding Formula Libraries...');
      for (const item of SEED_FORMULA_LIBRARIES) {
        const savedLibrary = await this.formulaLibraryRepo.save(item.library);
        await this.formulaVersionRepo.save({
          ...item.defaultVersion,
          formulaLibraryId: savedLibrary.id,
        });
      }
    }

    // 4. Seed Supplementary Fields
    const suppCount = await this.suppFieldRepo.count();
    if (suppCount === 0) {
      this.logger.log('Seeding Supplementary Field Definitions...');
      await this.suppFieldRepo.save(SEED_SUPPLEMENTARY_FIELDS);
    }

    // 5. Seed Initial Master Scopes
    const scopeCount = await this.masterItemRepo.count({ where: { type: MasterItemType.SCOPE } });
    if (scopeCount === 0) {
      this.logger.log('Seeding initial Master Scopes...');
      await this.masterItemRepo.save([
        { type: MasterItemType.SCOPE, code: 'SCOPE_1', name: 'Scope 1', description: 'Direct Operations & Combustion', sortOrder: 1, isActive: true },
        { type: MasterItemType.SCOPE, code: 'SCOPE_2', name: 'Scope 2', description: 'Purchased Electricity, Heating, Cooling', sortOrder: 2, isActive: true },
        { type: MasterItemType.SCOPE, code: 'SCOPE_3', name: 'Scope 3', description: 'Value Chain & Indirect Emissions', sortOrder: 3, isActive: true },
      ]);
    }

    // 6. Seed Enterprise Activity Categories
    const categoryCount = await this.masterItemRepo.count({ where: { type: MasterItemType.ACTIVITY_CATEGORY } });
    if (categoryCount === 0) {
      this.logger.log('Seeding Enterprise Activity Categories...');
      const scope1 = await this.masterItemRepo.findOne({ where: { code: 'SCOPE_1' } });
      const scope2 = await this.masterItemRepo.findOne({ where: { code: 'SCOPE_2' } });
      const scope3 = await this.masterItemRepo.findOne({ where: { code: 'SCOPE_3' } });

      await this.masterItemRepo.save([
        // Scope 1 Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'STAT_COMB', name: 'Stationary Combustion', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 1, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'MOBI_COMB', name: 'Mobile Combustion', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 2, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PROC_EMIS', name: 'Process Emissions', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 3, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'FUGI_EMIS', name: 'Fugitive Emissions', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 4, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'EMER_GEN', name: 'Emergency Generator', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 5, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'COMP_VEH', name: 'Company Vehicles', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 6, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'IND_FURN', name: 'Industrial Furnace', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 7, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'BOILERS', name: 'Boilers & Steam Generation', scope: 'Scope 1', parentId: scope1?.id, sortOrder: 8, isActive: true },

        // Scope 2 Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PURC_ELEC', name: 'Purchased Electricity', scope: 'Scope 2', parentId: scope2?.id, sortOrder: 9, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PURC_STEAM', name: 'Purchased Steam', scope: 'Scope 2', parentId: scope2?.id, sortOrder: 10, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PURC_HEAT', name: 'Purchased Heat', scope: 'Scope 2', parentId: scope2?.id, sortOrder: 11, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PURC_COOL', name: 'Purchased Cooling', scope: 'Scope 2', parentId: scope2?.id, sortOrder: 12, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'RENEW_ELEC', name: 'Renewable Electricity', scope: 'Scope 2', parentId: scope2?.id, sortOrder: 13, isActive: true },

        // Scope 3 Categories (All 15 GHG Protocol Standard Categories)
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_1_GOODS', name: 'Cat 1: Purchased Goods & Services', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 14, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_2_CAPITAL', name: 'Cat 2: Capital Goods', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 15, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_3_FUEL_ENERGY', name: 'Cat 3: Fuel & Energy Related Activities', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 16, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_4_UPSTREAM_TRANS', name: 'Cat 4: Upstream Transport & Distribution', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 17, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_5_WASTE', name: 'Cat 5: Waste Generated in Operations', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 18, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_6_BIZ_TRAVEL', name: 'Cat 6: Business Travel', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 19, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_7_COMMUTE', name: 'Cat 7: Employee Commuting', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 20, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_8_UPSTREAM_LEASE', name: 'Cat 8: Upstream Leased Assets', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 21, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_9_DOWNSTREAM_TRANS', name: 'Cat 9: Downstream Transport & Distribution', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 22, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_10_PROCESSING', name: 'Cat 10: Processing of Sold Products', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 23, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_11_USE_SOLD', name: 'Cat 11: Use of Sold Products', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 24, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_12_END_LIFE', name: 'Cat 12: End-of-Life Treatment', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 25, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_13_DOWNSTREAM_LEASE', name: 'Cat 13: Downstream Leased Assets', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 26, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_14_FRANCHISE', name: 'Cat 14: Franchises', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 27, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CAT_15_INVESTMENT', name: 'Cat 15: Investments', scope: 'Scope 3', parentId: scope3?.id, sortOrder: 28, isActive: true },
      ]);
    }

    // 7. Seed Enterprise Fuel Types
    const fuelCount = await this.masterItemRepo.count({ where: { type: MasterItemType.FUEL_TYPE } });
    if (fuelCount === 0) {
      this.logger.log('Seeding Enterprise Fuel Types...');
      await this.masterItemRepo.save([
        { type: MasterItemType.FUEL_TYPE, code: 'DIESEL', name: 'Diesel', subType: 'Fuel', description: 'Standard Commercial Diesel', sortOrder: 1, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'PETROL', name: 'Petrol / Gasoline', subType: 'Fuel', description: 'Unleaded Motor Gasoline', sortOrder: 2, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'NAT_GAS', name: 'Natural Gas', subType: 'Fuel', description: 'Pipeline Natural Gas', sortOrder: 3, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'LPG', name: 'LPG (Liquefied Petroleum Gas)', subType: 'Fuel', description: 'Propane / Butane Mixture', sortOrder: 4, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'COAL', name: 'Bituminous Coal', subType: 'Fuel', description: 'Commercial Coal', sortOrder: 5, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'HEAVY_OIL', name: 'Heavy Fuel Oil (HFO)', subType: 'Fuel', description: 'Residual Fuel Oil #6', sortOrder: 6, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'BIOMASS', name: 'Wood / Biomass Pellets', subType: 'Fuel', description: 'Solid Biofuel', sortOrder: 7, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'HYDROGEN', name: 'Hydrogen (H2)', subType: 'Fuel', description: 'Compressed Green/Blue Hydrogen', sortOrder: 8, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'BIODIESEL', name: 'Bio-Diesel (B100)', subType: 'Fuel', description: 'Fatty Acid Methyl Ester (FAME)', sortOrder: 9, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'CNG', name: 'Compressed Natural Gas (CNG)', subType: 'Fuel', description: 'Transport CNG', sortOrder: 10, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'LNG', name: 'Liquefied Natural Gas (LNG)', subType: 'Fuel', description: 'Cryogenic LNG', sortOrder: 11, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'JET_FUEL', name: 'Jet A-1 Aviation Fuel', subType: 'Fuel', description: 'Commercial Aviation Kerosene', sortOrder: 12, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'MARINE_FUEL', name: 'Marine Gas Oil (MGO)', subType: 'Fuel', description: 'Low Sulfur Marine Gas Oil', sortOrder: 13, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'KEROSENE', name: 'Kerosene / Burning Oil', subType: 'Fuel', description: 'Heating Kerosene', sortOrder: 14, isActive: true },
        { type: MasterItemType.FUEL_TYPE, code: 'ELECTRICITY', name: 'Grid Electricity', subType: 'Fuel', description: 'Standard National Grid Electricity', sortOrder: 15, isActive: true },
      ]);
    }

    // 8. Seed Enterprise Gas Types
    const gasMasterCount = await this.masterItemRepo.count({ where: { type: MasterItemType.GAS_TYPE } });
    if (gasMasterCount === 0) {
      this.logger.log('Seeding Enterprise Gas Types...');
      await this.masterItemRepo.save([
        { type: MasterItemType.GAS_TYPE, code: 'CO2', name: 'Carbon Dioxide (CO₂)', subType: 'Gas', sortOrder: 1, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'CH4', name: 'Methane (CH₄)', subType: 'Gas', sortOrder: 2, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'N2O', name: 'Nitrous Oxide (N₂O)', subType: 'Gas', sortOrder: 3, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'HFC_134A', name: 'HFC-134a (Refrigerant)', subType: 'Gas', sortOrder: 4, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'HFC_23', name: 'HFC-23 (Fluoroform)', subType: 'Gas', sortOrder: 5, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'HFC_32', name: 'HFC-32 (Difluoromethane)', subType: 'Gas', sortOrder: 6, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'HFC_125', name: 'HFC-125 (Pentafluoroethane)', subType: 'Gas', sortOrder: 7, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'HFC_143A', name: 'HFC-143a', subType: 'Gas', sortOrder: 8, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'PFC_14', name: 'PFC-14 (Tetrafluoromethane)', subType: 'Gas', sortOrder: 9, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'PFC_116', name: 'PFC-116 (Hexafluoroethane)', subType: 'Gas', sortOrder: 10, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'SF6', name: 'Sulfur Hexafluoride (SF₆)', subType: 'Gas', sortOrder: 11, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'NF3', name: 'Nitrogen Trifluoride (NF₃)', subType: 'Gas', sortOrder: 12, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'R410A', name: 'R-410A Blend', subType: 'Gas', sortOrder: 13, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'R404A', name: 'R-404A Blend', subType: 'Gas', sortOrder: 14, isActive: true },
        { type: MasterItemType.GAS_TYPE, code: 'R407C', name: 'R-407C Blend', subType: 'Gas', sortOrder: 15, isActive: true },
      ]);
    }

    // 9. Seed Measurement Units by Dimension
    const unitCount = await this.masterItemRepo.count({ where: { type: MasterItemType.UNIT } });
    if (unitCount === 0) {
      this.logger.log('Seeding Enterprise Measurement Units by Dimension...');
      await this.masterItemRepo.save([
        // Volume Units
        { type: MasterItemType.UNIT, code: 'LITRE', name: 'Litre (L)', subType: 'Volume', sortOrder: 1, isActive: true },
        { type: MasterItemType.UNIT, code: 'M3', name: 'Cubic Metre (m³)', subType: 'Volume', sortOrder: 2, isActive: true },
        { type: MasterItemType.UNIT, code: 'SM3', name: 'Standard Cubic Metre (sm³)', subType: 'Volume', sortOrder: 3, isActive: true },
        { type: MasterItemType.UNIT, code: 'NM3', name: 'Normal Cubic Metre (Nm³)', subType: 'Volume', sortOrder: 4, isActive: true },
        { type: MasterItemType.UNIT, code: 'GAL_US', name: 'US Gallon', subType: 'Volume', sortOrder: 5, isActive: true },
        { type: MasterItemType.UNIT, code: 'GAL_IMP', name: 'Imperial Gallon', subType: 'Volume', sortOrder: 6, isActive: true },
        { type: MasterItemType.UNIT, code: 'BARREL', name: 'Oil Barrel (bbl)', subType: 'Volume', sortOrder: 7, isActive: true },

        // Mass Units
        { type: MasterItemType.UNIT, code: 'KG', name: 'Kilogram (kg)', subType: 'Mass', sortOrder: 8, isActive: true },
        { type: MasterItemType.UNIT, code: 'GRAM', name: 'Gram (g)', subType: 'Mass', sortOrder: 9, isActive: true },
        { type: MasterItemType.UNIT, code: 'TONNE', name: 'Metric Tonne (t)', subType: 'Mass', sortOrder: 10, isActive: true },
        { type: MasterItemType.UNIT, code: 'LB', name: 'Pound (lb)', subType: 'Mass', sortOrder: 11, isActive: true },

        // Energy Units
        { type: MasterItemType.UNIT, code: 'KWH', name: 'Kilowatt-hour (kWh)', subType: 'Energy', sortOrder: 12, isActive: true },
        { type: MasterItemType.UNIT, code: 'MWH', name: 'Megawatt-hour (MWh)', subType: 'Energy', sortOrder: 13, isActive: true },
        { type: MasterItemType.UNIT, code: 'GJ', name: 'Gigajoule (GJ)', subType: 'Energy', sortOrder: 14, isActive: true },
        { type: MasterItemType.UNIT, code: 'MJ', name: 'Megajoule (MJ)', subType: 'Energy', sortOrder: 15, isActive: true },
        { type: MasterItemType.UNIT, code: 'BTU', name: 'British Thermal Unit (BTU)', subType: 'Energy', sortOrder: 16, isActive: true },
        { type: MasterItemType.UNIT, code: 'THERM', name: 'Therm', subType: 'Energy', sortOrder: 17, isActive: true },

        // Distance & Transport Units
        { type: MasterItemType.UNIT, code: 'KM', name: 'Kilometre (km)', subType: 'Distance', sortOrder: 18, isActive: true },
        { type: MasterItemType.UNIT, code: 'MILE', name: 'Mile', subType: 'Distance', sortOrder: 19, isActive: true },
        { type: MasterItemType.UNIT, code: 'PASSENGER_KM', name: 'Passenger-km', subType: 'Distance', sortOrder: 20, isActive: true },
        { type: MasterItemType.UNIT, code: 'TONNE_KM', name: 'Tonne-km', subType: 'Distance', sortOrder: 21, isActive: true },

        // Currency Units
        { type: MasterItemType.UNIT, code: 'USD', name: 'US Dollar ($)', subType: 'Currency', sortOrder: 22, isActive: true },
        { type: MasterItemType.UNIT, code: 'EUR', name: 'Euro (€)', subType: 'Currency', sortOrder: 23, isActive: true },
        { type: MasterItemType.UNIT, code: 'GBP', name: 'British Pound (£)', subType: 'Currency', sortOrder: 24, isActive: true },
        { type: MasterItemType.UNIT, code: 'INR', name: 'Indian Rupee (₹)', subType: 'Currency', sortOrder: 25, isActive: true },
        { type: MasterItemType.UNIT, code: 'JPY', name: 'Japanese Yen (¥)', subType: 'Currency', sortOrder: 26, isActive: true },
      ]);
    }

    // 10. Seed Enterprise Factor Sources & Factor Versions
    const sourceCount = await this.masterItemRepo.count({ where: { type: MasterItemType.FACTOR_SOURCE } });
    if (sourceCount === 0) {
      this.logger.log('Seeding Enterprise Emission Factor Sources...');
      await this.masterItemRepo.save([
        { type: MasterItemType.FACTOR_SOURCE, code: 'IPCC', name: 'IPCC', description: 'Intergovernmental Panel on Climate Change', sortOrder: 1, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'DEFRA', name: 'DEFRA', description: 'UK Department for Environment, Food & Rural Affairs', sortOrder: 2, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'EPA', name: 'US EPA', description: 'US Environmental Protection Agency', sortOrder: 3, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'EGRID', name: 'US eGRID', description: 'US EPA Emissions & Generation Resource Integrated Database', sortOrder: 4, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'CEA', name: 'CEA India', description: 'Central Electricity Authority of India', sortOrder: 5, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'IEA', name: 'IEA', description: 'International Energy Agency National Grid Factors', sortOrder: 6, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'ECOINVENT', name: 'Ecoinvent', description: 'Global Life Cycle Inventory Database', sortOrder: 7, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'EXIOBASE', name: 'EXIOBASE', description: 'Multi-Regional Environmentally Extended Input-Output Database', sortOrder: 8, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'ADEME', name: 'ADEME France', description: 'French Agency for Ecological Transition', sortOrder: 9, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'NGER', name: 'NGER Australia', description: 'National Greenhouse and Energy Reporting Australia', sortOrder: 10, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'NIR_CANADA', name: 'Canada NIR', description: 'Environment and Climate Change Canada National Inventory', sortOrder: 11, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'GHG_PROTOCOL', name: 'GHG Protocol', description: 'WRI / WBCSD Global Standard', sortOrder: 12, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'PCAF', name: 'PCAF', description: 'Partnership for Carbon Accounting Financials', sortOrder: 13, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'CBAM', name: 'EU CBAM', description: 'EU Carbon Border Adjustment Mechanism Default Factors', sortOrder: 14, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'ISO', name: 'ISO 14064', description: 'International Organization for Standardization', sortOrder: 15, isActive: true },
      ]);
    }

    const versionCount = await this.masterItemRepo.count({ where: { type: MasterItemType.FACTOR_VERSION } });
    if (versionCount === 0) {
      this.logger.log('Seeding Enterprise Factor Versions...');
      const ipcc = await this.masterItemRepo.findOne({ where: { code: 'IPCC' } });
      const defra = await this.masterItemRepo.findOne({ where: { code: 'DEFRA' } });
      const ecoinvent = await this.masterItemRepo.findOne({ where: { code: 'ECOINVENT' } });
      const cea = await this.masterItemRepo.findOne({ where: { code: 'CEA' } });

      await this.masterItemRepo.save([
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_AR6', name: 'AR6', parentId: ipcc?.id, description: 'IPCC Sixth Assessment Report (100-yr GWP)', sortOrder: 1, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_AR5', name: 'AR5', parentId: ipcc?.id, description: 'IPCC Fifth Assessment Report', sortOrder: 2, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_AR4', name: 'AR4', parentId: ipcc?.id, description: 'IPCC Fourth Assessment Report', sortOrder: 3, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_2025', name: '2025', parentId: defra?.id, description: '2025 Annual Release Standard', sortOrder: 4, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_2024', name: '2024', parentId: defra?.id, description: '2024 Annual Release Standard', sortOrder: 5, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_2023', name: '2023', parentId: defra?.id, description: '2023 Annual Release Standard', sortOrder: 6, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_V39', name: 'v3.9', parentId: ecoinvent?.id, description: 'Version 3.9 Database Standard', sortOrder: 7, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_V38', name: 'v3.8', parentId: ecoinvent?.id, description: 'Version 3.8 Database Standard', sortOrder: 8, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_CEA_2024', name: '2024', parentId: cea?.id, description: 'CEA India Grid Factor v19.0 (2024)', sortOrder: 9, isActive: true },
      ]);
    }

    // 11. Seed Countries and Sub-National Regions
    const countryCount = await this.masterItemRepo.count({ where: { type: MasterItemType.COUNTRY } });
    if (countryCount === 0) {
      this.logger.log('Seeding Standard Countries and Grid Regions...');
      await this.masterItemRepo.save([
        { type: MasterItemType.COUNTRY, code: 'US', name: 'United States', sortOrder: 1, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'UK', name: 'United Kingdom', sortOrder: 2, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'DE', name: 'Germany', sortOrder: 3, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'FR', name: 'France', sortOrder: 4, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'IN', name: 'India', sortOrder: 5, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'CA', name: 'Canada', sortOrder: 6, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'AU', name: 'Australia', sortOrder: 7, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'JP', name: 'Japan', sortOrder: 8, isActive: true },
        { type: MasterItemType.COUNTRY, code: 'CN', name: 'China', sortOrder: 9, isActive: true },
      ]);

      const us = await this.masterItemRepo.findOne({ where: { code: 'US' } });
      const inCountry = await this.masterItemRepo.findOne({ where: { code: 'IN' } });

      await this.masterItemRepo.save([
        { type: MasterItemType.REGION, code: 'US_CAMX', name: 'CAMX (WECC California)', parentId: us?.id, description: 'California eGRID Subregion', sortOrder: 1, isActive: true },
        { type: MasterItemType.REGION, code: 'US_NYUP', name: 'NYUP (Upstream New York)', parentId: us?.id, description: 'New York eGRID Subregion', sortOrder: 2, isActive: true },
        { type: MasterItemType.REGION, code: 'US_ERCT', name: 'ERCT (ERCOT Texas)', parentId: us?.id, description: 'Texas Grid Subregion', sortOrder: 3, isActive: true },
        { type: MasterItemType.REGION, code: 'IN_NORTH', name: 'India Northern Grid', parentId: inCountry?.id, description: 'CEA Northern Regional Grid', sortOrder: 4, isActive: true },
        { type: MasterItemType.REGION, code: 'IN_SOUTH', name: 'India Southern Grid', parentId: inCountry?.id, description: 'CEA Southern Regional Grid', sortOrder: 5, isActive: true },
      ]);
    }

    // 7. Seed Standard Unit Conversions Matrix
    const ucCount = await this.unitConversionRepo.count();
    if (ucCount === 0) {
      this.logger.log('Seeding standard Unit Conversions matrix...');
      await this.unitConversionRepo.save([
        { fromUnitCode: 'kg', toUnitCode: 'tonne', multiplier: 0.001, offset: 0, dimension: PhysicalDimension.MASS, description: 'Kilograms to metric tonnes' },
        { fromUnitCode: 'g', toUnitCode: 'kg', multiplier: 0.001, offset: 0, dimension: PhysicalDimension.MASS, description: 'Grams to kilograms' },
        { fromUnitCode: 'lb', toUnitCode: 'kg', multiplier: 0.45359237, offset: 0, dimension: PhysicalDimension.MASS, description: 'Pounds to kilograms' },
        { fromUnitCode: 'kWh', toUnitCode: 'MWh', multiplier: 0.001, offset: 0, dimension: PhysicalDimension.ENERGY, description: 'Kilowatt-hours to Megawatt-hours' },
        { fromUnitCode: 'kWh', toUnitCode: 'MJ', multiplier: 3.6, offset: 0, dimension: PhysicalDimension.ENERGY, description: 'Kilowatt-hours to Megajoules' },
        { fromUnitCode: 'litre', toUnitCode: 'm3', multiplier: 0.001, offset: 0, dimension: PhysicalDimension.VOLUME, description: 'Litres to cubic metres' },
        { fromUnitCode: 'gal_us', toUnitCode: 'litre', multiplier: 3.78541, offset: 0, dimension: PhysicalDimension.VOLUME, description: 'US Gallons to litres' },
        { fromUnitCode: 'km', toUnitCode: 'mile', multiplier: 0.621371, offset: 0, dimension: PhysicalDimension.DISTANCE, description: 'Kilometres to miles' },
      ]);
    }
  }

  private async syncAllMasterItemsToScopeItems() {
    try {
      const masterCategories = await this.masterItemRepo.find({
        where: { type: MasterItemType.ACTIVITY_CATEGORY, isActive: true },
      });

      for (const cat of masterCategories) {
        if (!cat.scope) continue;
        const targetScope = cat.scope;
        const targetScopeCode = targetScope.toUpperCase().replace(/\s+/g, '_');

        const existingScope = await this.scopeItemRepo.findOne({
          where: [
            { serviceCode: 'CARBON', name: cat.name },
            { serviceCode: 'CARBON', code: cat.code },
          ],
        });

        if (existingScope) {
          existingScope.scope = targetScope;
          existingScope.scopeCode = targetScopeCode;
          existingScope.name = cat.name;
          existingScope.isActive = true;
          await this.scopeItemRepo.save(existingScope);
        } else {
          const newScope = this.scopeItemRepo.create({
            serviceCode: 'CARBON',
            scope: targetScope,
            scopeCode: targetScopeCode,
            name: cat.name,
            code: cat.code,
            description: cat.description || `Dynamic category for ${cat.name}`,
            sortOrder: cat.sortOrder || 99,
            isActive: true,
          });
          await this.scopeItemRepo.save(newScope);
        }
      }
    } catch (err) {
      this.logger.error('Failed to sync master items to service scope items', err);
    }
  }

  private async recordVersion(
    masterItemId: number,
    action: string,
    snapshot: Record<string, any>,
    diffBefore?: Record<string, any>,
    diffAfter?: Record<string, any>,
    changeReason?: string,
    userId?: number,
    reqContext?: { ipAddress?: string; userAgent?: string; correlationId?: string },
  ) {
    try {
      const versionCount = await this.versionRepo.count({ where: { masterItemId } });
      const changes: Record<string, { old: any; new: any }> = {};

      if (diffBefore && diffAfter) {
        Object.keys(diffAfter).forEach((key) => {
          if (diffBefore[key] !== diffAfter[key]) {
            changes[key] = { old: diffBefore[key], new: diffAfter[key] };
          }
        });
      }

      const versionEntity = this.versionRepo.create({
        masterItemId,
        version: versionCount + 1,
        action,
        snapshot,
        changes: Object.keys(changes).length > 0 ? changes : null,
        changeReason: changeReason || `Master item ${action.toLowerCase()}d`,
        createdBy: userId || null,
        ipAddress: reqContext?.ipAddress || null,
        userAgent: reqContext?.userAgent || null,
        correlationId: reqContext?.correlationId || null,
      });
      await this.versionRepo.save(versionEntity);
    } catch (err) {
      this.logger.error(`Failed to record version snapshot for master item ${masterItemId}`, err);
    }
  }

  // ============================================================================
  // REFERENCE & DEPENDENCY VALIDATION
  // ============================================================================

  async checkMasterItemReferences(id: number) {
    const item = await this.masterItemRepo.findOneBy({ id });
    if (!item) return { isReferenced: false, references: [] };

    const references: string[] = [];

    // Check if any child master items reference this item as parent
    const childCount = await this.masterItemRepo.count({ where: { parentId: id, isActive: true } });
    if (childCount > 0) {
      references.push(`${childCount} child master item(s)`);
    }

    // Check if fuel/unit is referenced in emission factors
    if (item.type === MasterItemType.FUEL_TYPE || item.type === MasterItemType.UNIT) {
      const efCount = await this.efRepo.count({
        where: [
          { fuelOrGasType: item.name },
          { unit: item.name },
        ],
      });
      if (efCount > 0) {
        references.push(`${efCount} emission factor record(s)`);
      }
    }

    return {
      isReferenced: references.length > 0,
      references,
      message: references.length > 0
        ? `Item '${item.name}' is currently in use by ${references.join(', ')}.`
        : `Item '${item.name}' is not currently referenced and can be safely deleted or archived.`,
    };
  }

  // ============================================================================
  // EFFECTIVE DATING LOOKUP ENGINE
  // ============================================================================

  async getMasterItemsEffective(effectiveDateStr?: string, type?: string, organizationId?: number) {
    const dateVal = effectiveDateStr || new Date().toISOString().split('T')[0];

    const query = this.masterItemRepo.createQueryBuilder('item')
      .where('item.isActive = :isActive', { isActive: true })
      .andWhere('item.status = :status', { status: MasterItemStatus.PUBLISHED })
      .andWhere('(item.effectiveFrom IS NULL OR item.effectiveFrom <= :dateVal)', { dateVal })
      .andWhere('(item.effectiveTo IS NULL OR item.effectiveTo >= :dateVal)', { dateVal });

    if (organizationId) {
      query.andWhere('(item.organizationId = :orgId OR item.organizationId IS NULL)', { orgId: organizationId });
    }

    if (type) {
      query.andWhere('item.type = :type', { type });
    }

    return query.orderBy('item.name', 'ASC').getMany();
  }

  // ============================================================================
  // LIFECYCLE GOVERNANCE TRANSITIONS
  // ============================================================================

  async publishMasterItem(id: number, userId?: number) {
    const item = await this.masterItemRepo.findOneBy({ id });
    if (!item) throw new Error(`Master item ${id} not found`);

    item.status = MasterItemStatus.PUBLISHED;
    item.version += 1;
    item.updatedBy = userId || null;
    const updated = await this.masterItemRepo.save(item);

    await this.recordVersion(id, 'PUBLISH', updated, { status: item.status }, { status: MasterItemStatus.PUBLISHED }, 'Published master item', userId);
    return updated;
  }

  async deprecateMasterItem(id: number, userId?: number) {
    const item = await this.masterItemRepo.findOneBy({ id });
    if (!item) throw new Error(`Master item ${id} not found`);

    item.status = MasterItemStatus.DEPRECATED;
    item.version += 1;
    item.updatedBy = userId || null;
    const updated = await this.masterItemRepo.save(item);

    await this.recordVersion(id, 'DEPRECATE', updated, { status: item.status }, { status: MasterItemStatus.DEPRECATED }, 'Deprecated master item', userId);
    return updated;
  }

  async archiveMasterItem(id: number, userId?: number) {
    const item = await this.masterItemRepo.findOneBy({ id });
    if (!item) throw new Error(`Master item ${id} not found`);

    item.status = MasterItemStatus.ARCHIVED;
    item.version += 1;
    item.updatedBy = userId || null;
    const updated = await this.masterItemRepo.save(item);

    await this.recordVersion(id, 'ARCHIVE', updated, { status: item.status }, { status: MasterItemStatus.ARCHIVED }, 'Archived master item', userId);
    return updated;
  }

  // ============================================================================
  // MAKER-CHECKER CHANGE REQUEST WORKFLOWS
  // ============================================================================

  async createChangeRequest(dto: CreateChangeRequestDto, userId?: number) {
    const req = this.changeReqRepo.create({
      masterItemId: dto.masterItemId || null,
      actionType: dto.actionType,
      proposedChanges: dto.proposedChanges,
      requestReason: dto.requestReason,
      status: ChangeRequestStatus.SUBMITTED,
      createdBy: userId || null,
    });
    return this.changeReqRepo.save(req);
  }

  async getChangeRequests(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.changeReqRepo.find({
      where,
      relations: { masterItem: true },
      order: { id: 'DESC' },
    });
  }

  async reviewChangeRequest(id: number, dto: ReviewChangeRequestDto, reviewerUserId?: number) {
    const changeReq = await this.changeReqRepo.findOneBy({ id });
    if (!changeReq) throw new Error(`Change request ${id} not found`);

    changeReq.status = dto.status as ChangeRequestStatus;
    changeReq.reviewerComments = dto.reviewerComments;
    changeReq.reviewedBy = reviewerUserId || null;
    changeReq.reviewedAt = new Date();

    const savedReq = await this.changeReqRepo.save(changeReq);

    // If approved, apply proposed changes to target master item
    if (dto.status === ChangeRequestStatus.APPROVED && changeReq.masterItemId) {
      await this.updateMasterItem(changeReq.masterItemId, changeReq.proposedChanges, reviewerUserId);
      changeReq.status = ChangeRequestStatus.PUBLISHED;
      await this.changeReqRepo.save(changeReq);
    }

    return savedReq;
  }

  // ============================================================================
  // READ METHODS
  // ============================================================================

  async getMasterRoles() {
    return await this.masterRolesRepository
      .createQueryBuilder('role')
      .select(['role.id', 'role.roleName', 'role.roleShortName', 'role.isActive', 'role.createdAt'])
      .where('role.isActive = :isActive', { isActive: true })
      .orderBy('role.id', 'ASC')
      .getMany();
  }

  async getMasterApprovalStatuses() {
    return await this.masterApprovalStatusRepository
      .createQueryBuilder('status')
      .select(['status.id', 'status.name', 'status.isActive', 'status.createdAt'])
      .where('status.isActive = :isActive', { isActive: true })
      .orderBy('status.id', 'ASC')
      .getMany();
  }

  async getGasTypes(): Promise<GasType[]> {
    return this.gasTypeRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getGwpVersions(): Promise<GwpVersion[]> {
    return this.gwpVersionRepo.find({
      where: { isActive: true },
      relations: { multipliers: { gasType: true } },
      order: { id: 'ASC' },
    });
  }

  async getEmissionFactorSets(): Promise<EmissionFactorSet[]> {
    return this.factorSetRepo.find({
      where: { isActive: true },
      relations: { rows: { values: { gasType: true } } },
      order: { id: 'DESC' },
    });
  }

  async getFormulaLibraries(): Promise<FormulaLibrary[]> {
    return this.formulaLibraryRepo.find({
      where: { isActive: true },
      relations: { versions: true },
      order: { id: 'ASC' },
    });
  }

  async getCalculationPolicies(organizationId?: number): Promise<CalculationPolicy[]> {
    const query = this.policyRepo.createQueryBuilder('policy')
      .leftJoinAndSelect('policy.factorSet', 'factorSet')
      .leftJoinAndSelect('policy.gwpVersion', 'gwpVersion')
      .leftJoinAndSelect('policy.formulaVersion', 'formulaVersion')
      .where('policy.isActive = :isActive', { isActive: true });

    if (organizationId) {
      query.andWhere(
        '(policy.organizationId = :orgId OR policy.organizationId IS NULL)',
        { orgId: organizationId },
      );
    } else {
      query.andWhere('policy.organizationId IS NULL');
    }

    return query.orderBy('policy.id', 'ASC').getMany();
  }

  async getSupplementaryFields(category?: string): Promise<SupplementaryFieldDefinition[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    return this.suppFieldRepo.find({
      where,
      order: { sortOrder: 'ASC' },
    });
  }

  // ============================================================================
  // WRITE METHODS (ADMIN APIs)
  // ============================================================================

  async createGasType(dto: CreateGasTypeDto): Promise<GasType> {
    const entity = this.gasTypeRepo.create(dto);
    return this.gasTypeRepo.save(entity);
  }

  async createGwpVersion(dto: CreateGwpVersionDto): Promise<GwpVersion> {
    const entity = this.gwpVersionRepo.create(dto);
    return this.gwpVersionRepo.save(entity);
  }

  async addGasMultiplier(dto: CreateGasMultiplierDto): Promise<GasMultiplier> {
    const entity = this.gasMultiplierRepo.create(dto);
    return this.gasMultiplierRepo.save(entity);
  }

  async createEmissionFactorSet(dto: CreateEmissionFactorSetDto): Promise<EmissionFactorSet> {
    const entity = this.factorSetRepo.create(dto);
    return this.factorSetRepo.save(entity);
  }

  async createEmissionFactorRow(dto: CreateEmissionFactorRowDto): Promise<EmissionFactorRow> {
    const entity = this.factorRowRepo.create(dto);
    return this.factorRowRepo.save(entity);
  }

  async addEmissionFactorValue(dto: CreateEmissionFactorValueDto): Promise<EmissionFactorValue> {
    const entity = this.factorValueRepo.create(dto);
    return this.factorValueRepo.save(entity);
  }

  async createFormulaLibrary(dto: CreateFormulaLibraryDto): Promise<FormulaLibrary> {
    const library = this.formulaLibraryRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      category: dto.category || 'General',
    });
    const savedLibrary = await this.formulaLibraryRepo.save(library);

    const version = this.formulaVersionRepo.create({
      formulaLibraryId: savedLibrary.id,
      version: 1,
      expression: dto.expression,
      variables: JSON.stringify(['amount', 'factor']),
      isDefault: true,
    });
    await this.formulaVersionRepo.save(version);

    return this.formulaLibraryRepo.findOne({
      where: { id: savedLibrary.id },
      relations: { versions: true },
    });
  }

  async createCalculationPolicy(dto: CreateCalculationPolicyDto): Promise<CalculationPolicy> {
    const entity = this.policyRepo.create(dto);
    return this.policyRepo.save(entity);
  }

  async createSupplementaryField(dto: CreateSupplementaryFieldDto): Promise<SupplementaryFieldDefinition> {
    const entity = this.suppFieldRepo.create(dto);
    return this.suppFieldRepo.save(entity);
  }

  // ============================================================================
  // GENERIC MASTER ITEM CRUD WITH AUDIT VERSIONING
  // ============================================================================

  async getMasterItems(type?: string, parentId?: number, search?: string, organizationId?: number): Promise<MasterItem[]> {
    if ((await this.masterItemRepo.count()) === 0) {
      await this.seedMasterConfigs();
    }

    const query = this.masterItemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.parent', 'parent')
      .where('item.isActive = :isActive', { isActive: true });

    if (organizationId) {
      query.andWhere('(item.organizationId = :orgId OR item.organizationId IS NULL)', { orgId: organizationId });
    }

    if (type) {
      query.andWhere('item.type = :type', { type });
    }

    if (parentId) {
      query.andWhere('item.parentId = :parentId', { parentId });
    }

    if (search) {
      query.andWhere('(item.name ILIKE :search OR item.code ILIKE :search)', { search: `%${search}%` });
    }

    return query.orderBy('item.sortOrder', 'ASC').addOrderBy('item.name', 'ASC').getMany();
  }

  private generateCodeFromName(name: string): string {
    if (!name) return 'ITEM_' + Date.now();
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async createMasterItem(dto: CreateMasterItemDto, userId?: number): Promise<MasterItem> {
    if (!dto.code && dto.name) {
      dto.code = this.generateCodeFromName(dto.name);
    }
    if (dto.allowedUnits && typeof dto.allowedUnits === 'string') {
      dto.allowedUnits = (dto.allowedUnits as string).split(',').map((u) => u.trim()).filter(Boolean);
    }
    if (dto.sortOrder && typeof dto.sortOrder === 'string') {
      dto.sortOrder = parseInt(dto.sortOrder as any, 10) || 0;
    }
    const entity = this.masterItemRepo.create({
      ...(dto as unknown as MasterItem),
      version: 1,
      createdBy: userId || null,
    });
    const saved = await this.masterItemRepo.save(entity);

    // Record initial version snapshot
    await this.recordVersion(saved.id, 'CREATE', saved, undefined, undefined, dto.changeReason || 'Initial Creation', userId);

    // Auto-sync dynamic Activity Category to ServiceScopeItem so it appears under /services/carbon
    if (saved.type === MasterItemType.ACTIVITY_CATEGORY || (saved.type as string) === 'ACTIVITY_CATEGORY') {
      try {
        const targetScope = saved.scope || dto.scope || 'Scope 1';
        const targetScopeCode = targetScope.toUpperCase().replace(/\s+/g, '_');
        const existingScope = await this.scopeItemRepo.findOne({
          where: { serviceCode: 'CARBON', name: saved.name },
        });
        if (!existingScope) {
          const newScope = this.scopeItemRepo.create({
            serviceCode: 'CARBON',
            scope: targetScope,
            scopeCode: targetScopeCode,
            name: saved.name,
            code: saved.code,
            description: saved.description || `Dynamic category for ${saved.name}`,
            sortOrder: saved.sortOrder || 99,
            isActive: true,
          });
          await this.scopeItemRepo.save(newScope);
        } else {
          existingScope.scope = targetScope;
          existingScope.scopeCode = targetScopeCode;
          existingScope.isActive = true;
          await this.scopeItemRepo.save(existingScope);
        }
      } catch (err) {
        this.logger.error('Failed to sync master item to service scope items', err);
      }
    }

    return saved;
  }

  async updateMasterItem(id: number, dto: UpdateMasterItemDto, userId?: number): Promise<MasterItem> {
    if (!dto.code && dto.name) {
      dto.code = this.generateCodeFromName(dto.name);
    }
    const oldItem = await this.masterItemRepo.findOneBy({ id });
    const nextVersion = (oldItem?.version || 1) + 1;

    await this.masterItemRepo.update(id, {
      ...(dto as any),
      version: nextVersion,
      updatedBy: userId || null,
    });

    const updated = await this.masterItemRepo.findOne({ where: { id }, relations: { parent: true } });

    if (updated) {
      // Record update version snapshot
      await this.recordVersion(
        id,
        'UPDATE',
        updated,
        oldItem || undefined,
        updated,
        dto.changeReason || 'Updated details',
        userId,
      );
    }

    if (updated && (updated.type === MasterItemType.ACTIVITY_CATEGORY || (updated.type as string) === 'ACTIVITY_CATEGORY')) {
      try {
        const targetScope = updated.scope || 'Scope 1';
        const targetScopeCode = targetScope.toUpperCase().replace(/\s+/g, '_');
        const oldName = oldItem?.name || updated.name;

        const existingScope = await this.scopeItemRepo.findOne({
          where: [
            { serviceCode: 'CARBON', name: oldName },
            { serviceCode: 'CARBON', code: updated.code },
          ],
        });

        if (existingScope) {
          existingScope.name = updated.name;
          existingScope.scope = targetScope;
          existingScope.scopeCode = targetScopeCode;
          existingScope.isActive = updated.isActive !== false;
          await this.scopeItemRepo.save(existingScope);
        } else {
          const newScope = this.scopeItemRepo.create({
            serviceCode: 'CARBON',
            scope: targetScope,
            scopeCode: targetScopeCode,
            name: updated.name,
            code: updated.code,
            description: updated.description || `Dynamic category for ${updated.name}`,
            sortOrder: updated.sortOrder || 99,
            isActive: true,
          });
          await this.scopeItemRepo.save(newScope);
        }
      } catch (err) {
        this.logger.error('Failed to sync updated master item to service scope items', err);
      }
    }

    return updated;
  }

  async softDeleteMasterItem(id: number, userId?: number): Promise<void> {
    const item = await this.masterItemRepo.findOneBy({ id });
    await this.masterItemRepo.update(id, {
      isActive: false,
      deletedBy: userId || null,
      deletedAt: new Date(),
    });

    if (item) {
      await this.recordVersion(id, 'SOFT_DELETE', item, undefined, undefined, 'Deactivated master item', userId);
    }

    if (item && item.name) {
      try {
        await this.scopeItemRepo.update(
          { serviceCode: 'CARBON', name: item.name },
          { isActive: false, deletedAt: new Date() },
        );
      } catch (err) {
        this.logger.error('Failed to deactivate corresponding scope item', err);
      }
    }
  }

  async getMasterItemHistory(masterItemId: number): Promise<MasterItemVersion[]> {
    return this.versionRepo.find({
      where: { masterItemId },
      order: { version: 'DESC' },
    });
  }

  // ============================================================================
  // UNIT CONVERSION MATRIX METHODS
  // ============================================================================

  async getUnitConversions(): Promise<UnitConversion[]> {
    return this.unitConversionRepo.find({
      where: { isActive: true },
      order: { dimension: 'ASC', fromUnitCode: 'ASC' },
    });
  }

  async createUnitConversion(dto: CreateUnitConversionDto, userId?: number): Promise<UnitConversion> {
    const fromUnitCode = dto.fromUnitCode || dto.fromUnit || '';
    const toUnitCode = dto.toUnitCode || dto.toUnit || '';
    const entity = this.unitConversionRepo.create({
      ...(dto as unknown as UnitConversion),
      fromUnitCode,
      toUnitCode,
      createdBy: userId || null,
    });
    return this.unitConversionRepo.save(entity);
  }

  async updateUnitConversion(id: number, dto: UpdateUnitConversionDto, userId?: number): Promise<UnitConversion> {
    await this.unitConversionRepo.update(id, {
      ...(dto as any),
      updatedBy: userId || null,
    });
    return this.unitConversionRepo.findOneBy({ id });
  }

  async deleteUnitConversion(id: number, userId?: number): Promise<void> {
    await this.unitConversionRepo.update(id, {
      isActive: false,
      deletedBy: userId || null,
      deletedAt: new Date(),
    });
  }

  async convertUnit(amount: number, fromUnitCode: string, toUnitCode: string): Promise<{ convertedAmount: number; multiplier: number; offset: number } | null> {
    if (fromUnitCode === toUnitCode) {
      return { convertedAmount: amount, multiplier: 1, offset: 0 };
    }

    const direct = await this.unitConversionRepo.findOne({
      where: { fromUnitCode, toUnitCode, isActive: true },
    });

    if (direct) {
      return {
        convertedAmount: amount * direct.multiplier + direct.offset,
        multiplier: direct.multiplier,
        offset: direct.offset,
      };
    }

    const inverse = await this.unitConversionRepo.findOne({
      where: { fromUnitCode: toUnitCode, toUnitCode: fromUnitCode, isActive: true },
    });

    if (inverse && inverse.multiplier !== 0) {
      const invMultiplier = 1 / inverse.multiplier;
      return {
        convertedAmount: (amount - inverse.offset) * invMultiplier,
        multiplier: invMultiplier,
        offset: 0,
      };
    }

    return null;
  }

  // ============================================================================
  // BULK MATRIX IMPORT & EXPORT
  // ============================================================================

  async exportMasterMatrix() {
    const efList = await this.efRepo.find({ order: { id: 'ASC' } });
    const masterCategories = await this.masterItemRepo.find({ where: { type: MasterItemType.ACTIVITY_CATEGORY } });
    const categoryScopeMap = new Map<string, string>();
    masterCategories.forEach((c) => categoryScopeMap.set(c.name, c.scope || 'Scope 1'));

    if (efList.length === 0) {
      return [
        { Scope: 'Scope 1', Category: 'Stationary Combustion', 'Activity / Fuel': 'Natural Gas', Unit: 'sm³', Formula: '(amount * factor) / 1000', 'Factor Value': 2.021, 'Factor Source': 'DEFRA', Version: '2024', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 1', Category: 'Mobile Combustion', 'Activity / Fuel': 'Diesel', Unit: 'Litre', Formula: '(amount * factor) / 1000', 'Factor Value': 2.676, 'Factor Source': 'DEFRA', Version: '2024', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 1', Category: 'Fugitive Emissions', 'Activity / Fuel': 'R134a', Unit: 'kg', Formula: 'amount * GWP', 'Factor Value': 1430, 'Factor Source': 'IPCC', Version: 'AR6', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 2', Category: 'Purchased Electricity', 'Activity / Fuel': 'Grid Electricity', Unit: 'kWh', Formula: '(amount * factor) / 1000', 'Factor Value': 0.385, 'Factor Source': 'IEA', Version: '2024', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 2', Category: 'Purchased Electricity', 'Activity / Fuel': 'Renewable Electricity', Unit: 'kWh', Formula: '(amount * factor) / 1000', 'Factor Value': 0.000, 'Factor Source': 'IEA', Version: '2024', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 3', Category: 'Business Travel', 'Activity / Fuel': 'Flight', Unit: 'km', Formula: 'distance * factor', 'Factor Value': 0.158, 'Factor Source': 'DEFRA', Version: '2024', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 3', Category: 'Employee Commuting', 'Activity / Fuel': 'Car', Unit: 'km', Formula: 'distance * factor', 'Factor Value': 0.171, 'Factor Source': 'DEFRA', Version: '2024', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 3', Category: 'Purchased Goods', 'Activity / Fuel': 'Steel', Unit: 'tonne', Formula: 'weight * factor', 'Factor Value': 1.890, 'Factor Source': 'Ecoinvent', Version: 'v3.9', GWP: 'AR6', Status: 'Active' },
        { Scope: 'Scope 3', Category: 'Investments', 'Activity / Fuel': 'Equity Investment (Manufacturing)', Unit: 'USD', Formula: '(amount * factor) / 1000', 'Factor Value': 0.350, 'Factor Source': 'PCAF', Version: '2023', GWP: 'AR6', Status: 'Active' },
      ];
    }

    return efList.map((ef) => {
      const scope = categoryScopeMap.get(ef.category) || 'Scope 1';
      return {
        Scope: scope,
        Category: ef.category,
        'Activity / Fuel': ef.fuelOrGasType,
        Unit: ef.unit,
        Formula: ef.formula || '(amount * factor) / 1000',
        'Factor Value': ef.factor,
        'Factor Source': ef.source,
        Version: ef.version,
        GWP: 'AR6',
        Status: ef.isActive ? 'Active' : 'Inactive',
      };
    });
  }

  async bulkImportMasterItems(dto: BulkImportMasterItemsDto, userId?: number) {
    const { items, dryRun } = dto;
    const results = {
      total: items.length,
      successCount: 0,
      failedCount: 0,
      errors: [] as string[],
      importedItems: [] as any[],
    };

    for (let i = 0; i < items.length; i++) {
      const raw = items[i] as any;

      // Extract matrix fields with fallbacks
      const scope = raw.Scope || raw.scope || 'Scope 1';
      const category = raw.Category || raw.category || raw.activityCategory;
      const activityFuel = raw['Activity / Fuel'] || raw['Activity/Fuel'] || raw['Activity Fuel'] || raw.fuelOrGasType || raw.fuelType || raw.name;
      const unit = raw.Unit || raw.unit || 'sm3';
      const formula = raw.Formula || raw.formula || '(amount * factor) / 1000';
      const factorValRaw = raw['Factor Value'] ?? raw.FactorValue ?? raw.factor ?? raw.factorValue ?? 0;
      const factorValue = typeof factorValRaw === 'string' ? parseFloat(factorValRaw) : Number(factorValRaw);
      const factorSource = raw['Factor Source'] || raw.FactorSource || raw.source || 'DEFRA';
      const version = raw.Version || raw.version || '2024';
      const status = raw.Status || raw.status || 'Active';

      // Check if item is Unit Conversion row
      if (raw.fromUnit && raw.toUnit) {
        try {
          if (!dryRun) {
            const mult = typeof raw.multiplier === 'string' ? parseFloat(raw.multiplier) : Number(raw.multiplier || 1);
            const off = typeof raw.offset === 'string' ? parseFloat(raw.offset) : Number(raw.offset || 0);
            const saved = await this.createUnitConversion({
              fromUnit: raw.fromUnit,
              toUnit: raw.toUnit,
              multiplier: isNaN(mult) ? 1 : mult,
              offset: isNaN(off) ? 0 : off,
              dimension: raw.dimension || 'MASS',
              description: raw.description || `Rule ${raw.fromUnit} -> ${raw.toUnit}`,
            });
            results.importedItems.push(saved);
          }
          results.successCount++;
        } catch (err: any) {
          results.failedCount++;
          results.errors.push(`Row ${i + 1} (${raw.fromUnit} -> ${raw.toUnit}): ${err?.message || 'Unit conversion import failed'}`);
        }
        continue;
      }

      // Check if item is standard MasterItem or Matrix row
      if (raw.type && raw.name && !category && !activityFuel) {
        // Standard MasterItem import
        try {
          if (!dryRun) {
            const saved = await this.createMasterItem({ ...raw, changeReason: 'Excel import' }, userId);
            results.importedItems.push(saved);
          }
          results.successCount++;
        } catch (err: any) {
          results.failedCount++;
          results.errors.push(`Row ${i + 1} (${raw.name}): ${err?.message || 'Save failed'}`);
        }
        continue;
      }

      // Matrix Row import
      if (!category || !activityFuel) {
        results.failedCount++;
        results.errors.push(`Row ${i + 1}: Both 'Category' and 'Activity / Fuel' columns are required.`);
        continue;
      }

      try {
        if (!dryRun) {
          // 1. Ensure Scope master item exists
          let scopeItem = await this.masterItemRepo.findOne({
            where: { type: MasterItemType.SCOPE, name: scope },
          });
          if (!scopeItem) {
            scopeItem = await this.createMasterItem({
              type: MasterItemType.SCOPE,
              name: scope,
              code: this.generateCodeFromName(scope),
            }, userId);
          }

          // 2. Ensure Category master item exists
          let catItem = await this.masterItemRepo.findOne({
            where: { type: MasterItemType.ACTIVITY_CATEGORY, name: category },
          });
          if (!catItem) {
            catItem = await this.createMasterItem({
              type: MasterItemType.ACTIVITY_CATEGORY,
              name: category,
              scope,
              code: this.generateCodeFromName(category),
            }, userId);
          }

          // 3. Ensure Fuel/Activity master item exists
          let fuelItem = await this.masterItemRepo.findOne({
            where: { type: MasterItemType.FUEL_TYPE, name: activityFuel },
          });
          if (!fuelItem) {
            fuelItem = await this.createMasterItem({
              type: MasterItemType.FUEL_TYPE,
              name: activityFuel,
              scope,
              parentId: catItem.id,
              allowedUnits: [unit],
              code: this.generateCodeFromName(activityFuel),
            }, userId);
          }

          // 4. Ensure Unit master item exists
          let unitItem = await this.masterItemRepo.findOne({
            where: { type: MasterItemType.UNIT, name: unit },
          });
          if (!unitItem) {
            unitItem = await this.createMasterItem({
              type: MasterItemType.UNIT,
              name: unit,
              code: this.generateCodeFromName(unit),
            }, userId);
          }

          // 5. Ensure Factor Source master item exists
          let sourceItem = await this.masterItemRepo.findOne({
            where: { type: MasterItemType.FACTOR_SOURCE, name: factorSource },
          });
          if (!sourceItem) {
            sourceItem = await this.createMasterItem({
              type: MasterItemType.FACTOR_SOURCE,
              name: factorSource,
              code: this.generateCodeFromName(factorSource),
            }, userId);
          }

          // 6. Ensure Factor Version master item exists
          let versionItem = await this.masterItemRepo.findOne({
            where: { type: MasterItemType.FACTOR_VERSION, name: String(version) },
          });
          if (!versionItem) {
            versionItem = await this.createMasterItem({
              type: MasterItemType.FACTOR_VERSION,
              name: String(version),
              code: this.generateCodeFromName(String(version)),
            }, userId);
          }

          // 7. Upsert EmissionFactor entity with full Foreign Keys
          let ef = await this.efRepo.findOne({
            where: [
              {
                scopeId: scopeItem?.id,
                activityCategoryId: catItem?.id,
                fuelGasTypeId: fuelItem?.id,
                measurementUnitId: unitItem?.id,
                factorSourceId: sourceItem?.id,
                factorVersionId: versionItem?.id,
              },
              {
                category,
                fuelOrGasType: activityFuel,
                source: factorSource,
                version: String(version),
              },
            ],
          });

          if (!ef) {
            ef = this.efRepo.create({
              scope,
              category,
              fuelOrGasType: activityFuel,
              unit,
              source: factorSource,
              version: String(version),
              factor: isNaN(factorValue) ? 0 : factorValue,
              co2: raw.co2 ? Number(raw.co2) : undefined,
              ch4: raw.ch4 ? Number(raw.ch4) : undefined,
              n2o: raw.n2o ? Number(raw.n2o) : undefined,
              co2e: raw.co2e ? Number(raw.co2e) : (isNaN(factorValue) ? 0 : factorValue),
              scopeId: scopeItem?.id,
              activityCategoryId: catItem?.id,
              fuelGasTypeId: fuelItem?.id,
              measurementUnitId: unitItem?.id,
              factorSourceId: sourceItem?.id,
              factorVersionId: versionItem?.id,
              formula,
              isActive: status.toLowerCase() !== 'inactive',
            });
          } else {
            ef.scope = scope;
            ef.category = category;
            ef.fuelOrGasType = activityFuel;
            ef.unit = unit;
            ef.source = factorSource;
            ef.version = String(version);
            ef.factor = isNaN(factorValue) ? ef.factor : factorValue;
            if (raw.co2 !== undefined) ef.co2 = Number(raw.co2);
            if (raw.ch4 !== undefined) ef.ch4 = Number(raw.ch4);
            if (raw.n2o !== undefined) ef.n2o = Number(raw.n2o);
            if (raw.co2e !== undefined) ef.co2e = Number(raw.co2e);
            ef.scopeId = scopeItem?.id || ef.scopeId;
            ef.activityCategoryId = catItem?.id || ef.activityCategoryId;
            ef.fuelGasTypeId = fuelItem?.id || ef.fuelGasTypeId;
            ef.measurementUnitId = unitItem?.id || ef.measurementUnitId;
            ef.factorSourceId = sourceItem?.id || ef.factorSourceId;
            ef.factorVersionId = versionItem?.id || ef.factorVersionId;
            ef.formula = formula;
            ef.isActive = status.toLowerCase() !== 'inactive';
          }
          const savedEf = await this.efRepo.save(ef);
          results.importedItems.push(savedEf);
        }
        results.successCount++;
      } catch (err: any) {
        results.failedCount++;
        results.errors.push(`Row ${i + 1} (${category} - ${activityFuel}): ${err?.message || 'Matrix row import failed'}`);
      }
    }

    return results;
  }

  async filterMasterItems(payload: CommonListPayloadDto) {
    const { offSet = 0, limit = 10, searchInput = '', additionalFilter } = payload;
    const query = this.masterItemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.parent', 'parent')
      .where('item.isActive = :isActive', { isActive: true });

    if (additionalFilter?.type) {
      if (additionalFilter.type === 'FUEL_TYPE' || additionalFilter.type === 'GAS_TYPE') {
        query.andWhere('item.type IN (:...types)', { types: ['FUEL_TYPE', 'GAS_TYPE'] });
      } else {
        query.andWhere('item.type = :type', { type: additionalFilter.type });
      }
    }

    if (additionalFilter?.parentId) {
      query.andWhere('item.parentId = :parentId', { parentId: additionalFilter.parentId });
    }

    if (searchInput && searchInput.trim()) {
      query.andWhere('(item.name ILIKE :search OR item.code ILIKE :search)', {
        search: `%${searchInput.trim()}%`,
      });
    }

    query.orderBy('item.sortOrder', 'ASC').addOrderBy('item.name', 'ASC');

    const [listData, dataCount] = await query
      .skip(offSet)
      .take(limit)
      .getManyAndCount();

    return { listData, dataCount };
  }
}
