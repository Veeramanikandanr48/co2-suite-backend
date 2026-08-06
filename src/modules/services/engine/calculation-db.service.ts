import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { evaluate as mathEvaluate } from 'mathjs';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { CalculationSnapshot } from 'src/entities/calculation-snapshot.entity';
import {
  CalculationPolicy,
  EmissionFactorRow,
  EmissionFactorSet,
  EmissionFactorValue,
  FormulaVersion,
  GasMultiplier,
  GasType,
  GwpVersion,
} from 'src/entities/master-config.entity';
import { FactorResolver } from './factor-resolver';

export interface CalculationResult {
  totalCO2e: number;
  unitEf: number;
  formulaUsed: string;
  gasBreakdown: {
    CO2: number;
    CH4: number;
    N2O: number;
    HFC: number;
    PFC: number;
    SF6: number;
    NF3: number;
    total: number;
  };
  snapshotId?: number;
}

@Injectable()
export class CalculationDbService {
  private readonly logger = new Logger(CalculationDbService.name);

  constructor(
    @InjectRepository(CalculationPolicy)
    private readonly policyRepo: Repository<CalculationPolicy>,
    @InjectRepository(EmissionFactorSet)
    private readonly factorSetRepo: Repository<EmissionFactorSet>,
    @InjectRepository(EmissionFactorRow)
    private readonly factorRowRepo: Repository<EmissionFactorRow>,
    @InjectRepository(EmissionFactorValue)
    private readonly factorValueRepo: Repository<EmissionFactorValue>,
    @InjectRepository(GwpVersion)
    private readonly gwpVersionRepo: Repository<GwpVersion>,
    @InjectRepository(GasMultiplier)
    private readonly gasMultiplierRepo: Repository<GasMultiplier>,
    @InjectRepository(FormulaVersion)
    private readonly formulaVersionRepo: Repository<FormulaVersion>,
    @InjectRepository(CalculationSnapshot)
    private readonly snapshotRepo: Repository<CalculationSnapshot>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Performs database-driven emission calculation with exact per-gas GWP multiplication
   * and saves an immutable CalculationSnapshot.
   */
  async calculateAndSnapshot(
    entry: InventoryEntry,
    overrideFormula?: string,
    overrideEfVal?: number,
  ): Promise<CalculationResult> {
    const orgId = entry.organizationId;
    const category = entry.category || 'Stationary Combustion';
    const amount = Number(entry.amount) || 0;

    // 1. Resolve Policy
    let policy = await this.policyRepo.findOne({
      where: { organizationId: orgId, activityCategory: category, isActive: true },
      relations: { factorSet: true, gwpVersion: true, formulaVersion: true },
    });

    if (!policy) {
      policy = await this.policyRepo.findOne({
        where: { organizationId: null as any, activityCategory: category, isDefault: true, isActive: true },
        relations: { factorSet: true, gwpVersion: true, formulaVersion: true },
      });
    }

    // 2. Resolve Formula Expression
    let formulaExpression = overrideFormula || policy?.formulaVersion?.expression || '(amount * factor) / 1000';

    // 3. Resolve GWP Multipliers Map (default AR6)
    let gwpVersion = policy?.gwpVersion;
    if (!gwpVersion) {
      gwpVersion = await this.gwpVersionRepo.findOne({
        where: { isDefault: true, isActive: true },
        relations: { multipliers: { gasType: true } },
      });
    }

    const gwpMap: Record<string, number> = {
      CO2: 1.0,
      CH4: 27.9,
      N2O: 273.0,
      HFC: 1430.0,
      PFC: 6630.0,
      SF6: 25200.0,
      NF3: 17400.0,
    };

    if (gwpVersion?.multipliers) {
      for (const m of gwpVersion.multipliers) {
        if (m.gasType?.code) {
          gwpMap[m.gasType.code] = Number(m.multiplier);
        }
      }
    }

    // 4. Resolve Factor Row & Gas Values
    let factorRow: EmissionFactorRow | null = null;
    if (policy?.factorSetId && entry.name && entry.unit) {
      factorRow = await this.factorRowRepo.findOne({
        where: {
          factorSetId: policy.factorSetId,
          fuelType: entry.name,
          unit: entry.unit,
          isActive: true,
        },
        relations: { values: { gasType: true } },
      });
    }

    const gasFactorsMap: Record<string, number> = {};
    let unitEf = overrideEfVal ?? entry.ef ?? 0;

    if (factorRow && factorRow.values && factorRow.values.length > 0) {
      for (const v of factorRow.values) {
        if (v.gasType?.code) {
          gasFactorsMap[v.gasType.code] = Number(v.value);
        }
      }
    } else {
      // Fallback: use legacy unitEf with standard IPCC gas ratios
      const ratios = FactorResolver.resolveGasRatios(entry.category || 'SC');
      gasFactorsMap['CO2'] = unitEf * ratios.CO2;
      gasFactorsMap['CH4'] = unitEf * ratios.CH4;
      gasFactorsMap['N2O'] = unitEf * ratios.N2O;
      gasFactorsMap['HFC'] = unitEf * ratios.HFC;
      gasFactorsMap['PFC'] = unitEf * ratios.PFC;
      gasFactorsMap['SF6'] = unitEf * ratios.SF6;
      gasFactorsMap['NF3'] = unitEf * ratios.NF3;
    }

    // 5. Calculate Per-Gas CO2e Emissions
    const gasEmissions: Record<string, number> = {
      CO2: 0, CH4: 0, N2O: 0, HFC: 0, PFC: 0, SF6: 0, NF3: 0,
    };

    let totalCO2e = 0;

    for (const gas of Object.keys(gasEmissions)) {
      const gasFactor = gasFactorsMap[gas] || 0;
      const gwpMult = gwpMap[gas] || 1.0;

      if (gasFactor > 0) {
        try {
          const baseResult = mathEvaluate(formulaExpression, { amount, factor: gasFactor, ef: gasFactor });
          const gasCo2e = Number(baseResult) * gwpMult;
          gasEmissions[gas] = Number(gasCo2e.toFixed(6));
        } catch {
          // Fallback if formula evaluation fails
          gasEmissions[gas] = Number(((amount * gasFactor) / 1000 * gwpMult).toFixed(6));
        }
      }
      totalCO2e += gasEmissions[gas];
    }

    totalCO2e = Number(totalCO2e.toFixed(3));

    const gasBreakdown = {
      CO2: gasEmissions.CO2,
      CH4: gasEmissions.CH4,
      N2O: gasEmissions.N2O,
      HFC: gasEmissions.HFC,
      PFC: gasEmissions.PFC,
      SF6: gasEmissions.SF6,
      NF3: gasEmissions.NF3,
      total: totalCO2e,
    };

    // 6. Save Immutable CalculationSnapshot
    let snapshotId: number | undefined;
    if (entry.id) {
      const snapshot = this.snapshotRepo.create({
        inventoryEntryId: entry.id,
        organizationId: orgId,
        policyRevisionId: policy?.id,
        gwpVersionId: gwpVersion?.id,
        amount,
        unit: entry.unit || '',
        formulaExpression,
        gasBreakdown: gasBreakdown,
        gasFactors: gasFactorsMap,
        gwpMultipliers: gwpMap,
        totalCO2e,
      });

      const savedSnapshot = await this.snapshotRepo.save(snapshot) as CalculationSnapshot;
      snapshotId = savedSnapshot.id;

      // 7. Emit Domain Event on EventBus
      this.eventEmitter.emit('calculation.completed', {
        entryId: entry.id,
        snapshotId,
        organizationId: orgId,
        totalCO2e,
      });
    }

    return {
      totalCO2e,
      unitEf,
      formulaUsed: formulaExpression,
      gasBreakdown,
      snapshotId,
    };
  }
}
