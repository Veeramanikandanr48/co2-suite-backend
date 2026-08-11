import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VersionFuelMapping } from 'src/entities/version-fuel-mapping.entity';
import { FuelUnitMapping } from 'src/entities/fuel-unit-mapping.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import {
  ResolveFactorDto,
  ResolvedFactorResultDto,
} from 'src/dto/resolve-factor.dto';

@Injectable()
export class FactorResolutionService {
  constructor(
    @InjectRepository(VersionFuelMapping)
    private readonly versionFuelRepo: Repository<VersionFuelMapping>,

    @InjectRepository(FuelUnitMapping)
    private readonly fuelUnitRepo: Repository<FuelUnitMapping>,

    @InjectRepository(MasterFactorVersion)
    private readonly versionRepo: Repository<MasterFactorVersion>,

    @InjectRepository(MasterFuel)
    private readonly fuelRepo: Repository<MasterFuel>,
  ) {}

  /**
   * Explicit 5-Tier Factor Resolution Engine:
   * 1. Version + Fuel + Unit (Specific dataset + fuel + unit match)
   * 2. Version + Fuel (Dataset + fuel match)
   * 3. Fuel + Unit (Fuel + unit match)
   * 4. Factor Version Baseline (Dataset-level default factor)
   * 5. Master Fuel Baseline (Global fuel default factor)
   */
  async resolveEmissionFactor(
    dto: ResolveFactorDto,
  ): Promise<ResolvedFactorResultDto> {
    const { fuelId, unitId, factorVersionId } = dto;

    // Tier 1: Version + Fuel + Unit
    if (factorVersionId && fuelId && unitId) {
      const vfMapping = await this.versionFuelRepo.findOne({
        where: { factorVersionId, fuelId, isActive: true },
        relations: {
          masterFactorVersion: { datasource: true },
          masterFuel: true,
        },
      });
      if (vfMapping && vfMapping.emissionFactor != null) {
        const fuMapping = await this.fuelUnitRepo.findOne({
          where: { fuelId, unitId, isActive: true },
          relations: { masterUnit: true },
        });
        if (fuMapping && fuMapping.emissionFactor != null) {
          const dsName =
            vfMapping.masterFactorVersion?.datasource?.name ||
            vfMapping.masterFactorVersion?.version ||
            'Version';
          const unitSymbol =
            fuMapping.masterUnit?.symbol || fuMapping.masterUnit?.name || '';
          return {
            emissionFactor: fuMapping.emissionFactor,
            efSource: `${dsName} (${vfMapping.masterFactorVersion?.version || ''}) - ${unitSymbol}`.trim(),
            resolutionLevel: 'VERSION_FUEL_UNIT',
            factorVersionId,
            fuelId,
            unitId,
          };
        }
      }
    }

    // Tier 2: Version + Fuel
    if (factorVersionId && fuelId) {
      const vfMapping = await this.versionFuelRepo.findOne({
        where: { factorVersionId, fuelId, isActive: true },
        relations: {
          masterFactorVersion: { datasource: true },
          masterFuel: true,
        },
      });
      if (vfMapping && vfMapping.emissionFactor != null) {
        const dsName =
          vfMapping.masterFactorVersion?.datasource?.name || 'Factor Version';
        const verName = vfMapping.masterFactorVersion?.version || '';
        return {
          emissionFactor: vfMapping.emissionFactor,
          efSource: `${dsName} ${verName} (Version-Fuel Mapping)`.trim(),
          resolutionLevel: 'VERSION_FUEL',
          factorVersionId,
          fuelId,
          unitId,
        };
      }
    }

    // Tier 3: Fuel + Unit
    if (fuelId && unitId) {
      const fuMapping = await this.fuelUnitRepo.findOne({
        where: { fuelId, unitId, isActive: true },
        relations: { masterFuel: true, masterUnit: true },
      });
      if (fuMapping && fuMapping.emissionFactor != null) {
        const fuelName = fuMapping.masterFuel?.name || 'Fuel';
        const unitSymbol =
          fuMapping.masterUnit?.symbol || fuMapping.masterUnit?.name || '';
        return {
          emissionFactor: fuMapping.emissionFactor,
          efSource: `${fuelName} per ${unitSymbol} (Fuel-Unit Mapping)`.trim(),
          resolutionLevel: 'FUEL_UNIT',
          factorVersionId,
          fuelId,
          unitId,
        };
      }
    }

    // Tier 4: Factor Version Baseline
    if (factorVersionId) {
      const versionEntity = await this.versionRepo.findOne({
        where: { id: factorVersionId, isActive: true },
        relations: { datasource: true },
      });
      if (versionEntity && versionEntity.emissionFactor != null) {
        const dsName = versionEntity.datasource?.name || 'Factor Version';
        return {
          emissionFactor: versionEntity.emissionFactor,
          efSource: `${dsName} ${versionEntity.version} Baseline`.trim(),
          resolutionLevel: 'FACTOR_VERSION_BASELINE',
          factorVersionId,
          fuelId,
          unitId,
        };
      }
    }

    // Tier 5: Master Fuel Baseline
    if (fuelId) {
      const fuelEntity = await this.fuelRepo.findOne({
        where: { id: fuelId, isActive: true },
      });
      if (fuelEntity && fuelEntity.emissionFactor != null) {
        return {
          emissionFactor: fuelEntity.emissionFactor,
          efSource: `${fuelEntity.name} Baseline Factor`.trim(),
          resolutionLevel: 'MASTER_FUEL_BASELINE',
          factorVersionId,
          fuelId,
          unitId,
        };
      }
    }

    throw new BadRequestException(
      `Unable to resolve emission factor for input: fuelId=${fuelId ?? 'N/A'}, unitId=${unitId ?? 'N/A'}, factorVersionId=${factorVersionId ?? 'N/A'}. No factor exists across all 5 resolution tiers.`,
    );
  }
}
