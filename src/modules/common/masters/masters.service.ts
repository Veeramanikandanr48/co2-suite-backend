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
import { Service } from 'src/entities/service.entity';
import { ServiceDomain } from 'src/entities/service-domain.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { MasterType } from 'src/entities/master-type.entity';
import { MasterTypeSchemaVersion } from 'src/entities/master-type-schema-version.entity';
import { MasterTypeStatistics } from 'src/entities/master-type-statistics.entity';
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
import { Repository, In } from 'typeorm';
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
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ServiceDomain)
    private readonly serviceDomainRepo: Repository<ServiceDomain>,
    @InjectRepository(MasterCategory)
    private readonly categoryRepo: Repository<MasterCategory>,
    @InjectRepository(MasterType)
    private readonly masterTypeRepo: Repository<MasterType>,
    @InjectRepository(MasterTypeSchemaVersion)
    private readonly schemaVersionRepo: Repository<MasterTypeSchemaVersion>,
    @InjectRepository(MasterTypeStatistics)
    private readonly statisticsRepo: Repository<MasterTypeStatistics>,
  ) { }

  async onApplicationBootstrap() {
    try {
      // Migrate any existing 'GLOBAL' or NULL serviceCode master items to 'CARBON'
      await this.masterItemRepo.createQueryBuilder()
        .update(MasterItem)
        .set({ serviceCode: 'CARBON' })
        .where('serviceCode = :oldCode OR serviceCode IS NULL', { oldCode: 'GLOBAL' })
        .execute();

      await this.seedMetadataEngine();
      await this.seedServiceMasterTypeMappings();
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

        // Seed CBAM Master Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CBAM_STEEL', name: 'Iron & Steel Direct Operations', scope: 'Scope 1', serviceCode: 'CBAM', sortOrder: 29, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CBAM_ALUMINIUM', name: 'Aluminium Primary Smelting', scope: 'Scope 1', serviceCode: 'CBAM', sortOrder: 30, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CBAM_FERTILIZER', name: 'Nitrogen Fertilizers & Ammonia', scope: 'Scope 1', serviceCode: 'CBAM', sortOrder: 31, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CBAM_CEMENT', name: 'Cement Clinker Calcination', scope: 'Scope 1', serviceCode: 'CBAM', sortOrder: 32, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CBAM_ELECTRICITY', name: 'CBAM Electricity Import Generation', scope: 'Scope 2', serviceCode: 'CBAM', sortOrder: 33, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'CBAM_HYDROGEN', name: 'Hydrogen Production Process', scope: 'Scope 1', serviceCode: 'CBAM', sortOrder: 34, isActive: true },

        // Seed PEF Textiles Master Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PEF_FIBER_PROD', name: 'Fiber Cultivation & Polymerization', scope: 'Scope 3', serviceCode: 'PEF_TEXTILES', sortOrder: 35, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PEF_YARN_SPINNING', name: 'Yarn Spinning & Weaving', scope: 'Scope 1', serviceCode: 'PEF_TEXTILES', sortOrder: 36, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PEF_WET_PROCESSING', name: 'Wet Processing, Dyeing & Finishing', scope: 'Scope 1', serviceCode: 'PEF_TEXTILES', sortOrder: 37, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'PEF_GARMENT_ASSEMBLY', name: 'Garment Assembly & Cutting', scope: 'Scope 1', serviceCode: 'PEF_TEXTILES', sortOrder: 38, isActive: true },

        // Seed LCA Plastics Master Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'LCA_RESIN_SYNTHESIS', name: 'Polymer Resin Synthesis (PET/HDPE/PP)', scope: 'Scope 1', serviceCode: 'LCA_PLASTICS', sortOrder: 39, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'LCA_COMPOUNDING', name: 'Compounding & Additive Blending', scope: 'Scope 1', serviceCode: 'LCA_PLASTICS', sortOrder: 40, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'LCA_INJECTION_MOLDING', name: 'Injection Molding & Extrusion', scope: 'Scope 1', serviceCode: 'LCA_PLASTICS', sortOrder: 41, isActive: true },

        // Seed LCA Metals Master Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'LCA_ORE_SMELTING', name: 'Ore Smelting & Blast Furnace', scope: 'Scope 1', serviceCode: 'LCA_METALS', sortOrder: 42, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'LCA_SCRAP_REMELT', name: 'Secondary Scrap Remelting', scope: 'Scope 1', serviceCode: 'LCA_METALS', sortOrder: 43, isActive: true },

        // Seed ESG Master Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'ESG_CARBON_INTENSITY', name: 'GHG Intensity Metrics', scope: 'Scope 1', serviceCode: 'ESG', sortOrder: 44, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'ESG_ENERGY_WATER', name: 'Energy & Water Resource Usage', scope: 'Scope 1', serviceCode: 'ESG', sortOrder: 45, isActive: true },

        // Seed EPD Cables Master Categories
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'EPD_CONDUCTOR_DRAWING', name: 'Copper/Aluminium Conductor Drawing', scope: 'Scope 1', serviceCode: 'EPD_CABLES', sortOrder: 46, isActive: true },
        { type: MasterItemType.ACTIVITY_CATEGORY, code: 'EPD_INSULATION_EXTRUSION', name: 'XLPE/PVC Insulation Extrusion', scope: 'Scope 1', serviceCode: 'EPD_CABLES', sortOrder: 47, isActive: true },
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

  private async syncCategoryToScopeItems(cat: MasterItem) {
    if (!cat || !cat.scope) return;
    const targetScope = cat.scope;
    const targetScopeCode = targetScope.toUpperCase().replace(/\s+/g, '_');
    const targetServices = (!cat.serviceCode || cat.serviceCode === 'GLOBAL')
      ? ['CARBON', 'CBAM', 'PEF_TEXTILES', 'LCA_PLASTICS', 'LCA_METALS', 'ESG', 'EPD_CABLES']
      : [cat.serviceCode];

    for (const svcCode of targetServices) {
      const existingScope = await this.scopeItemRepo.findOne({
        where: [
          { serviceCode: svcCode, name: cat.name },
          { serviceCode: svcCode, code: cat.code },
        ],
      });

      if (existingScope) {
        existingScope.scope = targetScope;
        existingScope.scopeCode = targetScopeCode;
        existingScope.name = cat.name;
        existingScope.isActive = cat.isActive !== false;
        await this.scopeItemRepo.save(existingScope);
      } else {
        const newScope = this.scopeItemRepo.create({
          serviceCode: svcCode,
          scope: targetScope,
          scopeCode: targetScopeCode,
          name: cat.name,
          code: cat.code,
          description: cat.description || `Dynamic category for ${cat.name}`,
          sortOrder: cat.sortOrder || 99,
          isActive: cat.isActive !== false,
        });
        await this.scopeItemRepo.save(newScope);
      }
    }
  }

  private async syncAllMasterItemsToScopeItems() {
    try {
      const masterCategories = await this.masterItemRepo.find({
        where: { type: MasterItemType.ACTIVITY_CATEGORY, isActive: true },
      });

      for (const cat of masterCategories) {
        await this.syncCategoryToScopeItems(cat);
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

  async getMasterItems(
    type?: string,
    parentId?: number,
    search?: string,
    serviceCode?: string,
    organizationId?: number,
  ): Promise<MasterItem[]> {
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

    if (serviceCode && serviceCode !== 'ALL') {
      query.andWhere('(item.serviceCode = :serviceCode OR item.isGlobal = true)', { serviceCode });
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

    // Auto-sync dynamic Activity Category to ServiceScopeItem
    if (saved.type === MasterItemType.ACTIVITY_CATEGORY || (saved.type as string) === 'ACTIVITY_CATEGORY') {
      try {
        await this.syncCategoryToScopeItems(saved);
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
        await this.syncCategoryToScopeItems(updated);
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

  async bulkDeleteMasterItems(ids: (number | string)[], userId?: number): Promise<{ count: number }> {
    const numericIds = (ids || []).map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
    if (!numericIds.length) return { count: 0 };

    const items = await this.masterItemRepo.findBy({ id: In(numericIds) });

    await this.masterItemRepo.update(
      { id: In(numericIds) },
      {
        isActive: false,
        deletedBy: userId || null,
        deletedAt: new Date(),
      },
    );

    const itemNames = items.map((i) => i.name).filter(Boolean);
    if (itemNames.length > 0) {
      try {
        await this.scopeItemRepo.update(
          { serviceCode: 'CARBON', name: In(itemNames) },
          { isActive: false, deletedAt: new Date() },
        );
      } catch (err) {
        this.logger.error('Failed to bulk deactivate corresponding scope items', err);
      }
    }

    return { count: numericIds.length };
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

    if (additionalFilter?.serviceCode && additionalFilter.serviceCode !== 'ALL') {
      query.andWhere('(item.serviceCode = :serviceCode OR item.isGlobal = true)', { serviceCode: additionalFilter.serviceCode });
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

  private async seedServiceMasterTypeMappings() {
    const globalShared = [
      'ORGANIZATION', 'BUSINESS_UNIT', 'FACILITY', 'BUILDING', 'DEPARTMENT', 'METER',
      'COUNTRY', 'REGION', 'CURRENCY', 'UNIT', 'UNIT_CONVERSION', 'FUEL_TYPE', 'GAS_TYPE',
      'FACTOR_SOURCE', 'FACTOR_VERSION', 'FORMULA', 'DATA_QUALITY',
    ];

    const serviceTypeMappings: Record<string, string[]> = {
      CARBON: [
        ...globalShared,
        'SCOPE', 'ACTIVITY_CATEGORY', 'EMISSION_FACTOR', 'CALCULATION_POLICY', 'REPORTING_PERIOD', 'GWP_VERSION',
      ],
      CBAM: [
        ...globalShared,
        'CBAM_PRODUCT', 'CN_CODE', 'PRODUCTION_ROUTE', 'INSTALLATION', 'PRECURSOR_MATERIAL', 'COUNTRY_OF_ORIGIN', 'EMBEDDED_EMISSION_METHOD', 'ELECTRICITY_SOURCE', 'CBAM_REPORTING_PERIOD', 'CBAM_DECLARATION_STATUS', 'GWP_VERSION',
      ],
      PEF_TEXTILES: [
        ...globalShared,
        'PRODUCT_CATEGORY', 'MATERIAL', 'FIBER_TYPE', 'FABRIC_TYPE', 'CHEMICAL', 'PACKAGING_MATERIAL', 'TRANSPORT_MODE', 'END_OF_LIFE_SCENARIO', 'IMPACT_CATEGORY', 'PEF_DATASET',
      ],
      LCA_PLASTICS: [
        ...globalShared,
        'PLASTIC_RESIN', 'POLYMER', 'ADDITIVE', 'TRANSPORT_MODE', 'END_OF_LIFE_SCENARIO', 'LIFECYCLE_STAGE', 'DATABASE_SOURCE',
      ],
      LCA_METALS: [
        ...globalShared,
        'METAL_ALLOY', 'ORE', 'SMELTING_PROCESS', 'CASTING_PROCESS', 'TRANSPORT_MODE', 'END_OF_LIFE_SCENARIO', 'LIFECYCLE_STAGE', 'DATABASE_SOURCE',
      ],
      ESG: [
        ...globalShared,
        'ESG_FRAMEWORK', 'ESG_INDICATOR', 'KPI', 'SDG_GOAL', 'MATERIAL_TOPIC', 'DISCLOSURE_REQUIREMENT', 'REPORTING_BOUNDARY', 'STAKEHOLDER', 'GWP_VERSION',
      ],
      EPD_CABLES: [
        ...globalShared,
        'PCR', 'PRODUCT_FAMILY', 'DECLARED_UNIT', 'LIFECYCLE_MODULE', 'IMPACT_CATEGORY', 'VERIFICATION_BODY', 'PROGRAM_OPERATOR', 'VALIDITY_PERIOD',
      ],
    };

    for (const [code, allowedMasterTypes] of Object.entries(serviceTypeMappings)) {
      await this.serviceRepo.update({ code }, { allowedMasterTypes });
    }

    await this.masterItemRepo.createQueryBuilder()
      .update(MasterItem)
      .set({ isGlobal: true })
      .where('type IN (:...globalTypes)', { globalTypes: globalShared })
      .execute();
  }

  async getSupportedTypesForService(serviceCode: string): Promise<string[]> {
    const defaultCoreTypes = ['DASHBOARD', 'IMPORTS', 'HISTORY', 'VALIDATION'];
    if (!serviceCode) {
      return defaultCoreTypes;
    }

    const serviceRecord = await this.serviceRepo.findOne({ where: { code: serviceCode } });
    if (serviceRecord && Array.isArray(serviceRecord.allowedMasterTypes) && serviceRecord.allowedMasterTypes.length > 0) {
      return Array.from(new Set([...defaultCoreTypes, ...serviceRecord.allowedMasterTypes]));
    }

    const rawTypes = await this.masterItemRepo.createQueryBuilder('item')
      .select('DISTINCT item.type', 'type')
      .where('item.serviceCode = :serviceCode AND item.isActive = :isActive', { serviceCode, isActive: true })
      .getRawMany();

    const dbTypes = rawTypes.map((r) => r.type).filter(Boolean);

    if (dbTypes.length > 0) {
      return Array.from(new Set([...defaultCoreTypes, ...dbTypes]));
    }

    return Array.from(new Set([
      ...defaultCoreTypes,
      'ACTIVITY_CATEGORY', 'EMISSION_FACTOR', 'UNIT', 'DATA_QUALITY', 'REPORTING_FRAMEWORK',
    ]));
  }

  async seedMetadataEngine() {
    const serviceDomainsData = [
      { code: 'CARBON', name: 'Carbon Management', icon: 'FlameKindling', color: '#10b981' },
      { code: 'CBAM', name: 'CBAM Compliance', icon: 'Globe', color: '#3b82f6' },
      { code: 'PEF_TEXTILES', name: 'PEF Textiles', icon: 'Layers', color: '#ec4899' },
      { code: 'LCA_PLASTICS', name: 'LCA Plastics', icon: 'Database', color: '#8b5cf6' },
      { code: 'LCA_METALS', name: 'LCA Metals', icon: 'Zap', color: '#f59e0b' },
      { code: 'ESG', name: 'ESG Reporting', icon: 'FileCheck', color: '#06b6d4' },
      { code: 'EPD_CABLES', name: 'EPD Cables', icon: 'Activity', color: '#6366f1' },
    ];

    for (const d of serviceDomainsData) {
      const existing = await this.serviceDomainRepo.findOne({ where: { code: d.code } });
      if (!existing) {
        await this.serviceDomainRepo.save(this.serviceDomainRepo.create(d));
      }
    }

    const categoriesData = [
      { code: 'ORGANIZATION', name: 'Organization', icon: 'Building2', sortOrder: 1 },
      { code: 'GEOGRAPHY', name: 'Geography', icon: 'Globe', sortOrder: 2 },
      { code: 'TAXONOMY', name: 'Taxonomy', icon: 'Layers', sortOrder: 3 },
      { code: 'REFERENCE', name: 'Reference', icon: 'Database', sortOrder: 4 },
      { code: 'CARBON', name: 'Carbon Domain', icon: 'FlameKindling', sortOrder: 5 },
      { code: 'CBAM', name: 'CBAM Domain', icon: 'Globe', sortOrder: 6 },
      { code: 'PEF', name: 'PEF Domain', icon: 'Layers', sortOrder: 7 },
      { code: 'LCA', name: 'LCA Domain', icon: 'Zap', sortOrder: 8 },
      { code: 'ESG', name: 'ESG Domain', icon: 'FileCheck', sortOrder: 9 },
      { code: 'EPD', name: 'EPD Domain', icon: 'Activity', sortOrder: 10 },
      { code: 'GOVERNANCE', name: 'Governance', icon: 'Shield', sortOrder: 11 },
    ];

    for (const c of categoriesData) {
      const existing = await this.categoryRepo.findOne({ where: { code: c.code } });
      if (!existing) {
        await this.categoryRepo.save(this.categoryRepo.create(c));
      }
    }

    const allDomains = await this.serviceDomainRepo.find();
    const carbonDomain = allDomains.find(d => d.code === 'CARBON');
    const cbamDomain = allDomains.find(d => d.code === 'CBAM');
    const pefDomain = allDomains.find(d => d.code === 'PEF_TEXTILES');
    const plasticsDomain = allDomains.find(d => d.code === 'LCA_PLASTICS');
    const metalsDomain = allDomains.find(d => d.code === 'LCA_METALS');
    const esgDomain = allDomains.find(d => d.code === 'ESG');
    const epdDomain = allDomains.find(d => d.code === 'EPD_CABLES');

    const orgCategory = await this.categoryRepo.findOne({ where: { code: 'ORGANIZATION' } });
    const geoCategory = await this.categoryRepo.findOne({ where: { code: 'GEOGRAPHY' } });
    const taxCategory = await this.categoryRepo.findOne({ where: { code: 'TAXONOMY' } });
    const refCategory = await this.categoryRepo.findOne({ where: { code: 'REFERENCE' } });
    const carbonCategory = await this.categoryRepo.findOne({ where: { code: 'CARBON' } });
    const cbamCategory = await this.categoryRepo.findOne({ where: { code: 'CBAM' } });
    const pefCategory = await this.categoryRepo.findOne({ where: { code: 'PEF' } });
    const lcaCategory = await this.categoryRepo.findOne({ where: { code: 'LCA' } });
    const esgCategory = await this.categoryRepo.findOne({ where: { code: 'ESG' } });
    const epdCategory = await this.categoryRepo.findOne({ where: { code: 'EPD' } });
    const govCategory = await this.categoryRepo.findOne({ where: { code: 'GOVERNANCE' } });

    const typesDefinition = [
      { categoryId: orgCategory?.id, code: 'ORGANIZATION', name: 'Organization', icon: 'Building2', features: { hierarchy: true, bulkImport: true }, domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: orgCategory?.id, code: 'BUSINESS_UNIT', name: 'Business Unit', icon: 'Layers', features: { hierarchy: true, bulkImport: true }, domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: orgCategory?.id, code: 'FACILITY', name: 'Facility', icon: 'MapPin', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: orgCategory?.id, code: 'BUILDING', name: 'Building', icon: 'Building2', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: orgCategory?.id, code: 'DEPARTMENT', name: 'Department', icon: 'Layers', features: { hierarchy: true, bulkImport: true }, domains: [cbamDomain, esgDomain].filter(Boolean) },
      { categoryId: orgCategory?.id, code: 'METER', name: 'Meter', icon: 'Zap', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, esgDomain, epdDomain].filter(Boolean) },

      { categoryId: geoCategory?.id, code: 'COUNTRY', name: 'Country', icon: 'Globe', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: geoCategory?.id, code: 'REGION', name: 'Grid Region', icon: 'MapPin', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, esgDomain].filter(Boolean) },
      { categoryId: geoCategory?.id, code: 'CURRENCY', name: 'Currency', icon: 'BarChart3', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, esgDomain, epdDomain].filter(Boolean) },

      { categoryId: taxCategory?.id, code: 'SCOPE', name: 'GHG Scopes', icon: 'Layers', features: { hierarchy: true, bulkImport: true }, domains: [carbonDomain, cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: taxCategory?.id, code: 'ACTIVITY_CATEGORY', name: 'Activity Categories', icon: 'Activity', features: { hierarchy: true, bulkImport: true }, domains: [carbonDomain, cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: taxCategory?.id, code: 'FUEL_TYPE', name: 'Fuel Types', icon: 'FlameKindling', features: { hierarchy: false, bulkImport: true }, domains: [carbonDomain, cbamDomain, plasticsDomain, metalsDomain].filter(Boolean) },
      { categoryId: taxCategory?.id, code: 'GAS_TYPE', name: 'Gas Types', icon: 'FlaskConical', features: { hierarchy: false, bulkImport: true }, domains: [carbonDomain, cbamDomain].filter(Boolean) },
      { categoryId: taxCategory?.id, code: 'UNIT', name: 'Measurement Units', icon: 'BarChart3', features: { hierarchy: false, bulkImport: true }, domains: [carbonDomain, cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: taxCategory?.id, code: 'UNIT_CONVERSIONS', name: 'Unit Conversions', icon: 'GitBranch', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain].filter(Boolean) },
      {
        categoryId: taxCategory?.id,
        code: 'WASTE_CATEGORY',
        name: 'Waste Categories',
        icon: 'Layers',
        features: { hierarchy: true, bulkImport: true },
        domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain].filter(Boolean),
        masterTypeSchema: {
          version: 1,
          form: {
            fields: [
              { name: 'code', label: 'Waste Code', component: 'textbox', required: true, placeholder: 'e.g. HAZ_SOLVENT' },
              { name: 'name', label: 'Waste Category Name', component: 'textbox', required: true, placeholder: 'e.g. Organic Solvent Residue' },
              { name: 'description', label: 'Description', component: 'textbox', multiline: true },
              { name: 'hazardLevel', label: 'Hazard Classification', component: 'select', options: ['Non-Hazardous', 'Hazardous', 'Inert'] },
              { name: 'treatmentMethod', label: 'Default Disposal Method', component: 'select', options: ['Recycling', 'Incineration', 'Landfill', 'Composting'] },
            ],
          },
          grid: {
            columns: [
              { field: 'code', headerName: 'Waste Code', width: 140 },
              { field: 'name', headerName: 'Category Name', width: 220 },
              { field: 'description', headerName: 'Description', width: 260 },
              { field: 'status', headerName: 'Status', width: 120, type: 'badge' },
            ],
          },
          validation: { required: ['code', 'name'] },
          search: { searchFields: ['code', 'name', 'description'] },
        },
      },
      {
        categoryId: taxCategory?.id,
        code: 'VEHICLE_CATEGORY',
        name: 'Vehicle Categories',
        icon: 'Activity',
        features: { hierarchy: true, bulkImport: true },
        domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean),
        masterTypeSchema: {
          version: 1,
          runtimeVersion: '1.0',
          minimumRuntimeVersion: '1.0',
          layout: { create: 'dialog', edit: 'drawer', detail: 'drawer' },
          form: {
            fields: [
              { name: 'code', label: 'Vehicle Code', component: 'textbox', required: true, placeholder: 'e.g. EV_TRUCK_CLASS8' },
              { name: 'name', label: 'Category Name', component: 'textbox', required: true, placeholder: 'e.g. Heavy Duty Class 8 Electric Truck' },
              { name: 'description', label: 'Description', component: 'textbox', multiline: true },
              {
                name: 'fuelType',
                label: 'Primary Energy Source',
                component: 'lookup',
                lookup: { type: 'FUEL_TYPE', display: 'name', value: 'code', filter: { status: 'PUBLISHED' } },
                required: true,
              },
              { name: 'payloadCapacity', label: 'Payload Capacity (Tons)', component: 'number' },
              { name: 'batteryCapacity', label: 'Battery Capacity (kWh)', component: 'number' },
            ],
          },
          grid: {
            columns: [
              { field: 'code', headerName: 'Vehicle Code', width: 160 },
              { field: 'name', headerName: 'Category Name', width: 240 },
              { field: 'description', headerName: 'Description', width: 260 },
              { field: 'status', headerName: 'Status', width: 120, type: 'badge' },
            ],
          },
          validation: { required: ['code', 'name', 'fuelType'] },
          events: [
            {
              condition: { field: 'fuelType', operator: 'equals', value: 'Electricity' },
              actions: [{ type: 'show', field: 'batteryCapacity' }],
            },
          ],
          search: { searchFields: ['code', 'name', 'description'] },
        },
      },
      {
        categoryId: taxCategory?.id,
        code: 'ENERGY_SOURCE',
        name: 'Energy Sources',
        icon: 'Zap',
        features: { hierarchy: true, bulkImport: true },
        domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean),
        masterTypeSchema: {
          version: 1,
          runtimeVersion: '1.0',
          minimumRuntimeVersion: '1.0',
          layout: { create: 'dialog', edit: 'drawer', detail: 'drawer' },
          form: {
            fields: [
              { name: 'code', label: 'Energy Source Code', component: 'textbox', required: true, placeholder: 'e.g. SOLAR_PV' },
              { name: 'name', label: 'Source Name', component: 'textbox', required: true, placeholder: 'e.g. Onsite Solar Photovoltaic' },
              { name: 'description', label: 'Description', component: 'textbox', multiline: true },
              { name: 'renewableType', label: 'Renewable Classification', component: 'select', options: ['Renewable', 'Non-Renewable', 'Grid Mixed'] },
              { name: 'emissionFactorValue', label: 'Default Emission Factor (kg CO2e/kWh)', component: 'number' },
            ],
          },
          grid: {
            columns: [
              { field: 'code', headerName: 'Code', width: 140 },
              { field: 'name', headerName: 'Source Name', width: 220 },
              { field: 'description', headerName: 'Description', width: 260 },
              { field: 'status', headerName: 'Status', width: 120, type: 'badge' },
            ],
          },
          validation: { required: ['code', 'name'] },
          search: { searchFields: ['code', 'name', 'description'] },
        },
      },

      { categoryId: refCategory?.id, code: 'FACTOR_SOURCE', name: 'Factor Sources', icon: 'Database', features: { hierarchy: false, bulkImport: true }, domains: [carbonDomain, cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: refCategory?.id, code: 'FACTOR_VERSION', name: 'Factor Versions', icon: 'GitBranch', features: { versioning: true, bulkImport: true }, domains: [carbonDomain, cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: refCategory?.id, code: 'GWP_VERSION', name: 'GWP Versions', icon: 'Zap', features: { versioning: true, bulkImport: true }, domains: [cbamDomain, esgDomain].filter(Boolean) },
      { categoryId: refCategory?.id, code: 'FORMULA', name: 'Formula Library', icon: 'FlaskConical', features: { versioning: true, bulkImport: true }, domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: refCategory?.id, code: 'EMISSION_FACTOR', name: 'Emission Factors', icon: 'Database', features: { versioning: true, bulkImport: true }, domains: [carbonDomain, cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
      { categoryId: refCategory?.id, code: 'DATA_QUALITY', name: 'Data Quality', icon: 'FileCheck', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, esgDomain, epdDomain].filter(Boolean) },

      { categoryId: carbonCategory?.id, code: 'CALCULATION_POLICY', name: 'Calculation Policies', icon: 'FileCheck', features: { versioning: true, bulkImport: true }, domains: [cbamDomain].filter(Boolean) },
      { categoryId: carbonCategory?.id, code: 'REPORTING_PERIOD', name: 'Reporting Periods', icon: 'History', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain].filter(Boolean) },

      { categoryId: cbamCategory?.id, code: 'CN_CODE', name: 'CN Codes', icon: 'Database', features: { hierarchy: true, bulkImport: true }, domains: [cbamDomain].filter(Boolean) },
      { categoryId: cbamCategory?.id, code: 'CBAM_PRODUCT', name: 'CBAM Products', icon: 'Layers', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain].filter(Boolean) },
      { categoryId: cbamCategory?.id, code: 'PRODUCTION_ROUTE', name: 'Production Routes', icon: 'GitBranch', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain].filter(Boolean) },
      { categoryId: cbamCategory?.id, code: 'INSTALLATION', name: 'Installations', icon: 'MapPin', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain].filter(Boolean) },

      { categoryId: pefCategory?.id, code: 'MATERIAL', name: 'Materials', icon: 'Activity', features: { hierarchy: true, bulkImport: true }, domains: [pefDomain].filter(Boolean) },
      { categoryId: pefCategory?.id, code: 'FIBER_TYPE', name: 'Fibers', icon: 'Activity', features: { hierarchy: false, bulkImport: true }, domains: [pefDomain].filter(Boolean) },
      { categoryId: pefCategory?.id, code: 'CHEMICAL', name: 'Chemicals', icon: 'FlaskConical', features: { hierarchy: false, bulkImport: true }, domains: [pefDomain].filter(Boolean) },

      { categoryId: lcaCategory?.id, code: 'PLASTIC_RESIN', name: 'Plastic Resins', icon: 'Activity', features: { hierarchy: false, bulkImport: true }, domains: [plasticsDomain].filter(Boolean) },
      { categoryId: lcaCategory?.id, code: 'METAL_ALLOY', name: 'Metal Alloys', icon: 'Layers', features: { hierarchy: false, bulkImport: true }, domains: [metalsDomain].filter(Boolean) },
      { categoryId: lcaCategory?.id, code: 'SMELTING_PROCESS', name: 'Processes', icon: 'GitBranch', features: { hierarchy: false, bulkImport: true }, domains: [metalsDomain, plasticsDomain].filter(Boolean) },

      { categoryId: esgCategory?.id, code: 'ESG_FRAMEWORK', name: 'Frameworks', icon: 'FileCheck', features: { hierarchy: false, bulkImport: true }, domains: [esgDomain].filter(Boolean) },
      { categoryId: esgCategory?.id, code: 'KPI', name: 'KPIs', icon: 'BarChart3', features: { hierarchy: false, bulkImport: true }, domains: [esgDomain].filter(Boolean) },
      { categoryId: esgCategory?.id, code: 'SDG_GOAL', name: 'SDGs', icon: 'Globe', features: { hierarchy: false, bulkImport: true }, domains: [esgDomain].filter(Boolean) },

      { categoryId: epdCategory?.id, code: 'PCR', name: 'PCR Rules', icon: 'FileCheck', features: { versioning: true, bulkImport: true }, domains: [epdDomain].filter(Boolean) },
      { categoryId: epdCategory?.id, code: 'PROGRAM_OPERATOR', name: 'Program Operators', icon: 'Building2', features: { hierarchy: false, bulkImport: true }, domains: [epdDomain].filter(Boolean) },
      { categoryId: epdCategory?.id, code: 'VERIFICATION_BODY', name: 'Verification Bodies', icon: 'FileCheck', features: { hierarchy: false, bulkImport: true }, domains: [epdDomain].filter(Boolean) },

      { categoryId: govCategory?.id, code: 'HISTORY', name: 'Audit History', icon: 'History', features: { hierarchy: false, bulkImport: true }, domains: [cbamDomain, pefDomain, plasticsDomain, metalsDomain, esgDomain, epdDomain].filter(Boolean) },
    ];

    for (const t of typesDefinition) {
      if (!t.categoryId) continue;
      let typeRec = await this.masterTypeRepo.findOne({ where: { code: t.code }, relations: { serviceDomains: true } });
      if (!typeRec) {
        typeRec = this.masterTypeRepo.create({
          categoryId: t.categoryId,
          code: t.code,
          name: t.name,
          icon: t.icon,
          features: t.features || { hierarchy: false, bulkImport: true },
          serviceDomains: t.domains as ServiceDomain[],
        });
      } else {
        typeRec.features = t.features || { hierarchy: false, bulkImport: true };
        // Always sync service domain associations to reflect config changes
        typeRec.serviceDomains = t.domains as ServiceDomain[];
        if (t.masterTypeSchema) {
          typeRec.masterTypeSchema = t.masterTypeSchema;
        }
      }
      const savedType = await this.masterTypeRepo.save(typeRec);

      // Create MasterTypeSchemaVersion v1
      if (t.masterTypeSchema) {
        let schemaVer = await this.schemaVersionRepo.findOne({
          where: { masterTypeId: savedType.id, version: 1 },
        });

        if (!schemaVer) {
          const checksumStr = require('crypto')
            .createHash('sha256')
            .update(JSON.stringify(t.masterTypeSchema))
            .digest('hex');

          schemaVer = this.schemaVersionRepo.create({
            masterTypeId: savedType.id,
            version: 1,
            status: 'PUBLISHED',
            checksum: checksumStr,
            schema: t.masterTypeSchema,
            formSchema: t.masterTypeSchema.form,
            gridSchema: t.masterTypeSchema.grid,
            validationSchema: t.masterTypeSchema.validation,
            publishedAt: new Date(),
            publishedBy: 'system',
          });
          const savedSchemaVer = await this.schemaVersionRepo.save(schemaVer);

          savedType.activeSchemaVersionId = savedSchemaVer.id;
          await this.masterTypeRepo.save(savedType);
        }
      }

      // Seed pre-computed statistics
      const itemCount = await this.masterItemRepo.count({ where: { type: savedType.code, isActive: true } });
      const publishedCount = await this.masterItemRepo.count({ where: { type: savedType.code, status: MasterItemStatus.PUBLISHED, isActive: true } });
      const draftCount = await this.masterItemRepo.count({ where: { type: savedType.code, status: MasterItemStatus.DRAFT, isActive: true } });

      let stats = await this.statisticsRepo.findOne({ where: { masterTypeId: savedType.id } });
      if (!stats) {
        stats = this.statisticsRepo.create({
          masterTypeId: savedType.id,
          itemCount,
          publishedCount,
          draftCount,
          lastUpdated: new Date(),
        });
      } else {
        stats.itemCount = itemCount;
        stats.publishedCount = publishedCount;
        stats.draftCount = draftCount;
        stats.lastUpdated = new Date();
      }
      await this.statisticsRepo.save(stats);
    }
  }

  async getSidebarStructure(serviceCode: string) {
    const activeDomain = await this.serviceDomainRepo.findOne({ where: { code: serviceCode } });
    const domainId = activeDomain?.id;

    const categories = await this.categoryRepo.find({
      order: { sortOrder: 'ASC' },
      relations: { types: { serviceDomains: true } },
    });

    const allStats = await this.statisticsRepo.find();
    const statsMap = new Map(allStats.map(s => [s.masterTypeId, s.itemCount]));

    const resultCategories = [];

    for (const cat of categories) {
      const matchingTypes = [];

      for (const mt of cat.types) {
        if (!mt.isActive) continue;
        const belongsToService = !domainId || mt.serviceDomains?.some(sd => sd.id === domainId);
        if (belongsToService) {
          const itemCount = statsMap.get(mt.id) ?? 0;

          matchingTypes.push({
            id: mt.id,
            code: mt.code,
            name: mt.name,
            icon: mt.icon,
            color: mt.color,
            count: itemCount,
          });
        }
      }

      if (matchingTypes.length > 0) {
        resultCategories.push({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          icon: cat.icon,
          types: matchingTypes,
        });
      }
    }

    return {
      workspace: activeDomain?.name || serviceCode || 'Platform',
      categories: resultCategories,
    };
  }

  async getMasterTypeSchema(code: string) {
    const masterType = await this.masterTypeRepo.findOne({
      where: { code },
      relations: { category: true },
    });

    const activeSchemaVersion = masterType?.activeSchemaVersionId
      ? await this.schemaVersionRepo.findOne({ where: { id: masterType.activeSchemaVersionId } })
      : null;

    const defaultFormSchema = this.getDefaultFormSchema(code);
    const defaultGridSchema = this.getDefaultGridSchema(code);
    const defaultSearchSchema = this.getDefaultSearchSchema(code);

    const schemaDoc = activeSchemaVersion?.schema || masterType?.masterTypeSchema || {
      version: activeSchemaVersion?.version || 1,
      layout: { create: 'dialog', edit: 'drawer', detail: 'drawer' },
      form: masterType?.formSchema || defaultFormSchema,
      grid: masterType?.gridSchema || defaultGridSchema,
      validation: masterType?.validationSchema || { required: ['code', 'name'] },
      search: masterType?.searchSchema || defaultSearchSchema,
    };

    return {
      id: masterType?.id,
      code: masterType?.code || code,
      name: masterType?.name || code,
      category: masterType?.category?.name,
      features: masterType?.features || { hierarchy: true, versioning: true, allowAttributes: true, allowParent: true },
      activeSchemaVersion: activeSchemaVersion?.version || 1,
      checksum: activeSchemaVersion?.checksum,
      masterTypeSchema: schemaDoc,
      formSchema: schemaDoc.form || defaultFormSchema,
      gridSchema: schemaDoc.grid || defaultGridSchema,
      validationSchema: schemaDoc.validation || { required: ['code', 'name'] },
      searchSchema: schemaDoc.search || defaultSearchSchema,
      permissions: { create: true, edit: true, delete: true, import: true, export: true },
    };
  }

  private getDefaultFormSchema(code: string) {
    switch (code) {
      case 'FUEL_TYPE':
        return {
          fields: [
            { name: 'code', label: 'Fuel Code', component: 'textbox', required: true, placeholder: 'e.g. DIESEL_B5' },
            { name: 'name', label: 'Fuel Name', component: 'textbox', required: true, placeholder: 'e.g. Automotive Diesel Fuel B5' },
            { name: 'description', label: 'Description', component: 'textbox', multiline: true },
            { name: 'scope', label: 'GHG Scope', component: 'select', options: ['Scope 1', 'Scope 2', 'Scope 3'] },
            { name: 'subType', label: 'Fuel Family', component: 'select', options: ['Liquid Biofuel', 'Fossil Liquid', 'Gaseous', 'Solid Biomass'] },
            { name: 'allowedUnits', label: 'Valid Measurement Units', component: 'unit-selector', isMulti: true },
            { name: 'density', label: 'Default Density (kg/m³)', component: 'number', attributePath: 'attributes.density' },
            { name: 'ncv', label: 'Net Calorific Value (MJ/kg)', component: 'number', attributePath: 'attributes.ncv' },
          ],
        };
      case 'COUNTRY':
        return {
          fields: [
            { name: 'code', label: 'ISO Country Code', component: 'country', required: true, placeholder: 'US, DE, IN, JP' },
            { name: 'name', label: 'Country Name', component: 'textbox', required: true },
            { name: 'description', label: 'Region / Continent', component: 'textbox' },
            { name: 'currency', label: 'Default Currency', component: 'select', options: ['USD', 'EUR', 'INR', 'GBP', 'JPY'] },
          ],
        };
      default:
        return {
          fields: [
            { name: 'code', label: 'Master Code', component: 'textbox', required: true },
            { name: 'name', label: 'Name', component: 'textbox', required: true },
            { name: 'description', label: 'Description', component: 'textbox', multiline: true },
            { name: 'sortOrder', label: 'Sort Order', component: 'number', defaultValue: 0 },
            { name: 'isActive', label: 'Status Active', component: 'checkbox', defaultValue: true },
          ],
        };
    }
  }

  private getDefaultGridSchema(code: string) {
    return {
      columns: [
        { field: 'code', headerName: 'Code', width: 140, pinned: 'left' },
        { field: 'name', headerName: 'Name', width: 220 },
        { field: 'description', headerName: 'Description', width: 280 },
        { field: 'status', headerName: 'Status', width: 120, type: 'badge' },
        { field: 'updatedAt', headerName: 'Last Updated', width: 160, type: 'date' },
      ],
    };
  }

  private getDefaultSearchSchema(code: string) {
    return {
      searchFields: ['code', 'name', 'description'],
      quickFilters: [
        { name: 'status', label: 'Status', type: 'select', options: ['PUBLISHED', 'DRAFT', 'DEPRECATED'] },
      ],
    };
  }
}
