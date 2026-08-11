import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VersionFuelMapping } from 'src/entities/version-fuel-mapping.entity';
import { FuelUnitMapping } from 'src/entities/fuel-unit-mapping.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
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

    @InjectRepository(EmissionFactor)
    private readonly emissionFactorRepo: Repository<EmissionFactor>,
  ) {}

  /**
   * Explicit Factor Resolution Engine v2:
   * Tier 0: Direct EmissionFactor entity match (v2 normalized table)
   * Tier 1: Version + Fuel + Unit (Specific dataset + fuel + unit match)
   * Tier 2: Version + Fuel (Dataset + fuel match)
   * Tier 3: Fuel + Unit (Fuel + unit match)
   * Tier 4: Factor Version Baseline (Dataset-level default factor)
   * Tier 5: Master Fuel Baseline (Global fuel default factor)
   */
  async resolveEmissionFactor(
    dto: ResolveFactorDto,
  ): Promise<ResolvedFactorResultDto> {
    const { fuelId, unitId, factorVersionId } = dto;

    // Tier 0: v2 Normalized EmissionFactor Table
    if (factorVersionId || unitId || fuelId) {
      const efWhere: any = { isActive: true };
      if (factorVersionId) efWhere.datasetVersionId = factorVersionId;
      if (unitId) efWhere.unitId = unitId;
      if (fuelId) efWhere.fuelId = fuelId;

      let efEntities: EmissionFactor[] = [];
      if (typeof this.emissionFactorRepo.find === 'function') {
        efEntities = await this.emissionFactorRepo.find({
          where: efWhere,
          relations: {
            datasetVersion: { datasource: true },
            unit: true,
            components: { gas: true },
          },
        });
      }
      if (
        (!efEntities || efEntities.length === 0) &&
        typeof this.emissionFactorRepo.findOne === 'function'
      ) {
        const single = await this.emissionFactorRepo.findOne({
          where: efWhere,
          relations: {
            datasetVersion: { datasource: true },
            unit: true,
            components: { gas: true },
          },
        });
        if (single) efEntities = [single];
      }

      if (efEntities && efEntities.length > 0) {
        // 1. Inactive filtering
        efEntities = efEntities.filter((e) => e.isActive !== false);

        // 2. Activity Type compatibility check
        if (dto.activityTypeId) {
          efEntities = efEntities.filter(
            (e) => !e.activityTypeId || e.activityTypeId === dto.activityTypeId,
          );
        }

        // 3. Temporal validity & dataset effective dates check
        if (dto.activityDate) {
          const actTime = new Date(dto.activityDate).getTime();
          efEntities = efEntities.filter((e) => {
            if (e.validFrom && new Date(e.validFrom).getTime() > actTime)
              return false;
            if (e.validTo && new Date(e.validTo).getTime() < actTime)
              return false;
            if (e.datasetVersion) {
              if (
                e.datasetVersion.effectiveFrom &&
                new Date(e.datasetVersion.effectiveFrom).getTime() > actTime
              )
                return false;
              if (
                e.datasetVersion.effectiveTo &&
                new Date(e.datasetVersion.effectiveTo).getTime() < actTime
              )
                return false;
            }
            return true;
          });
        }

        // 4. Geography matching & fallback handling
        if (dto.geographyId && efEntities.length > 0) {
          const exactGeo = efEntities.filter(
            (e) => e.geographyId === dto.geographyId,
          );
          if (exactGeo.length > 0) {
            efEntities = exactGeo;
          } else {
            efEntities = efEntities.filter((e) => !e.geographyId);
          }
        }

        // 5. Ambiguity detection
        if (efEntities.length > 1) {
          throw new BadRequestException(
            `Ambiguous emission factors found (${efEntities.length} matching active V2 factors) for input criteria.`,
          );
        }

        if (efEntities.length === 1 && efEntities[0].factorValue != null) {
          const efEntity = efEntities[0];
          const dsName =
            efEntity.datasetVersion?.datasource?.name ||
            efEntity.datasetVersion?.datasetCode ||
            'v2 Dataset';
          const unitSymbol = efEntity.unit?.symbol || efEntity.unit?.name || '';
          return {
            emissionFactor: Number(efEntity.factorValue),
            efSource:
              `${dsName} (${efEntity.datasetVersion?.version || 'v2'}) - ${unitSymbol}`.trim(),
            resolutionLevel: 'V2_EMISSION_FACTOR',
            factorVersionId: factorVersionId || efEntity.datasetVersionId,
            fuelId: fuelId ?? undefined,
            unitId: unitId || efEntity.unitId,
          };
        }
      }
    }

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
            efSource:
              `${dsName} (${vfMapping.masterFactorVersion?.version || ''}) - ${unitSymbol}`.trim(),
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
