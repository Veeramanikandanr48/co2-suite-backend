import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GwpSet } from 'src/entities/gwp-set.entity';
import { GwpValue } from 'src/entities/gwp-value.entity';
import { MasterUnit } from 'src/entities/master-unit.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';
import { ApprovalModules, ApprovalMatrix } from 'src/entities/approval.entity';
import {
  SEED_GWP_SET,
  SEED_GWP_VALUES,
  SEED_MASTER_UNITS,
  SEED_MASTER_FACTOR_VERSIONS,
  SEED_MASTER_FUELS,
  SEED_EMISSION_FACTORS,
  SEED_UNIT_CONVERSIONS,
  SEED_APPROVAL_MODULE_INVENTORY,
  SEED_APPROVAL_MATRIX_INVENTORY,
} from './enterprise-methodology.seed';

/**
 * Bootstraps the enterprise GHG methodology master data
 * (GWP sets, units, factor versions, fuels, emission factors, conversions,
 * and the inventory approval module). All guards are count-based so
 * existing environments are never mutated.
 */
@Injectable()
export class EnterpriseSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EnterpriseSeedService.name);

  constructor(
    @InjectRepository(GwpSet)
    private readonly gwpSetRepo: Repository<GwpSet>,
    @InjectRepository(GwpValue)
    private readonly gwpValueRepo: Repository<GwpValue>,
    @InjectRepository(MasterUnit)
    private readonly unitRepo: Repository<MasterUnit>,
    @InjectRepository(MasterFactorVersion)
    private readonly versionRepo: Repository<MasterFactorVersion>,
    @InjectRepository(MasterFuel)
    private readonly fuelRepo: Repository<MasterFuel>,
    @InjectRepository(EmissionFactor)
    private readonly factorRepo: Repository<EmissionFactor>,
    @InjectRepository(UnitConversion)
    private readonly conversionRepo: Repository<UnitConversion>,
    @InjectRepository(ApprovalModules)
    private readonly approvalModuleRepo: Repository<ApprovalModules>,
    @InjectRepository(ApprovalMatrix)
    private readonly approvalMatrixRepo: Repository<ApprovalMatrix>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.seedGwp();
      await this.seedUnits();
      await this.seedVersions();
      await this.seedFuels();
      await this.seedFactors();
      await this.seedConversions();
      await this.seedApprovalModule();
    } catch (error) {
      this.logger.error('Enterprise seed failed', error?.stack ?? error);
    }
  }

  private async seedGwp(): Promise<void> {
    const count = await this.gwpSetRepo.count();
    if (count > 0) return;
    const set = await this.gwpSetRepo.save(
      this.gwpSetRepo.create({ ...SEED_GWP_SET, createdBy: 1 }),
    );
    await this.gwpValueRepo.save(
      SEED_GWP_VALUES.map((v) =>
        this.gwpValueRepo.create({
          ...v,
          gwpSetId: set.id,
          createdBy: 1,
        } as Partial<GwpValue>),
      ),
    );
    this.logger.log(
      `Seeded GWP set #${set.id} (${set.assessment}) with ${SEED_GWP_VALUES.length} gas values`,
    );
  }

  private async seedUnits(): Promise<void> {
    const count = await this.unitRepo.count();
    if (count > 0) return;
    await this.unitRepo.save(
      SEED_MASTER_UNITS.map((u) =>
        this.unitRepo.create({ ...u, createdBy: 1 } as Partial<MasterUnit>),
      ),
    );
    this.logger.log(`Seeded ${SEED_MASTER_UNITS.length} master units`);
  }

  private async seedVersions(): Promise<void> {
    const count = await this.versionRepo.count();
    if (count > 0) return;
    await this.versionRepo.save(
      SEED_MASTER_FACTOR_VERSIONS.map((v) =>
        this.versionRepo.create({
          ...v,
          createdBy: 1,
        } as Partial<MasterFactorVersion>),
      ),
    );
    this.logger.log(
      `Seeded ${SEED_MASTER_FACTOR_VERSIONS.length} factor versions`,
    );
  }

  private async seedFuels(): Promise<void> {
    const count = await this.fuelRepo.count();
    if (count > 0) return;
    await this.fuelRepo.save(
      SEED_MASTER_FUELS.map((f) =>
        this.fuelRepo.create({ ...f, createdBy: 1 } as Partial<MasterFuel>),
      ),
    );
    this.logger.log(`Seeded ${SEED_MASTER_FUELS.length} master fuels`);
  }

  private async seedFactors(): Promise<void> {
    const count = await this.factorRepo.count();
    if (count > 0) return;
    await this.factorRepo.save(
      SEED_EMISSION_FACTORS.map((f) =>
        this.factorRepo.create({
          ...f,
          createdBy: 1,
        } as Partial<EmissionFactor>),
      ),
    );
    this.logger.log(`Seeded ${SEED_EMISSION_FACTORS.length} emission factors`);
  }

  private async seedConversions(): Promise<void> {
    const count = await this.conversionRepo.count();
    if (count > 0) return;
    await this.conversionRepo.save(
      SEED_UNIT_CONVERSIONS.map((c) =>
        this.conversionRepo.create({
          ...c,
          createdBy: 1,
        } as Partial<UnitConversion>),
      ),
    );
    this.logger.log(`Seeded ${SEED_UNIT_CONVERSIONS.length} unit conversions`);
  }

  private async seedApprovalModule(): Promise<void> {
    const existing = await this.approvalModuleRepo.findOne({
      where: { moduleShortName: 'INVENTORY_ENTRY' },
    });
    if (existing) return;
    const module = await this.approvalModuleRepo.save(
      this.approvalModuleRepo.create({
        ...SEED_APPROVAL_MODULE_INVENTORY,
        createdBy: 1,
      } as Partial<ApprovalModules>),
    );
    await this.approvalMatrixRepo.save(
      SEED_APPROVAL_MATRIX_INVENTORY.map((m) =>
        this.approvalMatrixRepo.create({
          ...m,
          approvalModuleId: module.id,
          createdBy: 1,
        } as Partial<ApprovalMatrix>),
      ),
    );
    this.logger.log(
      `Seeded approval module INVENTORY_ENTRY (#${module.id}) with matrix rows`,
    );
  }
}
