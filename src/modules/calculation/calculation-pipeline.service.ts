import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { GwpSet } from 'src/entities/gwp-set.entity';
import { GwpValue } from 'src/entities/gwp-value.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  FactorResolutionService,
  type ResolvedFactor,
} from 'src/modules/methodology/factor-resolution.service';
import {
  UnitNormalizationService,
  UnsupportedConversionError,
} from './normalization.service';
import {
  InventoryValidationService,
  type ValidationIssue,
} from './validation.service';
import {
  CalculationRunService,
  type RunInputSnapshot,
} from './calculation-run.service';
import { InclusionStatus } from 'src/enums/ghg.enum';

export interface PipelineContext {
  organizationId: number;
  inventoryEntryId?: number;
  category: string;
  name: string;
  amount: number;
  unit?: string;
  fuelId?: number;
  fuelKey?: string;
  factorVersionId?: number;
  reportingYear?: number;
  geography?: string;
  basedOption?: 'activity' | 'spend';
  gwpSetId?: number;
  inclusionStatus?: string;
  runType?: string;
  parentRunId?: number;
  reason?: string;
}

export interface PipelineOutcome {
  ok: boolean;
  totalEmission: number;
  gasEmissions: Record<string, number>;
  biogenicCo2: number;
  factorId?: number;
  gwpSetId?: number;
  calculationResultId?: number;
  calculationRunId?: number;
  factorVersionId?: number;
  normalizedAmount?: number;
  normalizedUnit?: string;
  factorValue?: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  trace: string[];
  runType: string;
}

@Injectable()
export class CalculationPipelineService {
  private readonly logger = new Logger(CalculationPipelineService.name);

  constructor(
    @InjectRepository(EmissionFactor)
    private readonly emissionFactorRepo: Repository<EmissionFactor>,
    @InjectRepository(GwpSet)
    private readonly gwpSetRepo: Repository<GwpSet>,
    @InjectRepository(GwpValue)
    private readonly gwpValueRepo: Repository<GwpValue>,
    @InjectRepository(InventoryEntry)
    private readonly entryRepo: Repository<InventoryEntry>,
    private readonly factorResolution: FactorResolutionService,
    private readonly normalization: UnitNormalizationService,
    private readonly validation: InventoryValidationService,
    private readonly runService: CalculationRunService,
  ) {}

  /**
   * Full calculation pipeline (doc 23):
   * validate → inclusion gate → normalize → resolve factor → GWP → gas math → persist.
   *
   * Errors short-circuit with `ok: false`; nothing is persisted.
   * Fallbacks never happen silently — they are flagged and traced.
   */
  async run(ctx: PipelineContext): Promise<PipelineOutcome> {
    const trace: string[] = [];
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const runType = ctx.runType || 'SAVE';

    trace.push(`Pipeline started (${runType}): ${ctx.name} @ ${ctx.category}`);

    // ── 1. Structural validation ─────────────────────────────────────────────
    const issues = this.validation.validate({
      category: ctx.category,
      name: ctx.name,
      amount: ctx.amount,
      unit: ctx.unit,
      factorFound: true, // refined after pass 4
      inclusionStatus: ctx.inclusionStatus,
    });
    errors.push(...issues.filter((i) => i.severity === 'ERROR'));
    warnings.push(...issues.filter((i) => i.severity === 'WARNING'));
    if (
      errors.some(
        (e) => e.code === 'AMOUNT_POSITIVE' || e.code === 'UNIT_REQUIRED',
      )
    ) {
      return this.fail(ctx, trace, errors, warnings, runType);
    }

    // ── 2. Inclusion gate (organizational boundary) ──────────────────────────
    if (ctx.inclusionStatus === InclusionStatus.EXCLUDED) {
      trace.push(
        'Inclusion gate: source excluded by organizational boundary — no calculation performed',
      );
      return this.fail(
        ctx,
        trace,
        errors,
        warnings,
        runType,
        'Source is EXCLUDED per organizational boundary; emissions are not calculated.',
      );
    }

    // ── 3. Factor resolution ─────────────────────────────────────────────────
    const resolved: ResolvedFactor = await this.factorResolution.resolveFactor({
      fuelId: ctx.fuelId,
      fuelKey: ctx.fuelKey,
      factorVersionId: ctx.factorVersionId,
      reportingYear: ctx.reportingYear,
      geography: ctx.geography,
      basedOption: ctx.basedOption,
    });

    if (!resolved.factor) {
      errors.push({
        severity: 'ERROR',
        code: 'FACTOR_NOT_FOUND',
        message:
          resolved.fallbackReason || 'No emission factor could be resolved.',
      });
      return this.fail(ctx, trace, errors, warnings, runType);
    }
    const factor = resolved.factor;
    trace.push(
      `Factor resolved [${resolved.resolutionOrder}]: fuel#${factor.fuelId}, version#${factor.factorVersionId}, unit=${factor.unitBasis?.symbol ?? '?'}, geo=${factor.geography}`,
    );
    if (resolved.fallbackUsed) {
      trace.push(`FALLBACK: ${resolved.fallbackReason}`);
      warnings.push({
        severity: 'WARNING',
        code: 'FACTOR_FALLBACK_USED',
        message: resolved.fallbackReason || 'Fallback factor used.',
      });
    }

    // ── 4. Unit normalization ────────────────────────────────────────────────
    let normalizedAmount: number;
    let normalizedUnit: string;
    let conversionTrace: string;
    try {
      const n = await this.normalization.normalize(
        ctx.amount,
        ctx.unit,
        factor.unitBasis?.symbol || factor.outputUnit,
      );
      normalizedAmount = n.normalizedAmount;
      normalizedUnit = n.normalizedUnit;
      conversionTrace = n.trace;
      trace.push(`Normalization: ${conversionTrace}`);
    } catch (error) {
      if (error instanceof UnsupportedConversionError) {
        errors.push({
          severity: 'ERROR',
          code: 'UNIT_INCOMPATIBLE',
          message: error.message,
          field: 'unit',
        });
        return this.fail(ctx, trace, errors, warnings, runType);
      }
      throw error;
    }

    // ── 5. GWP set resolution ────────────────────────────────────────────────
    const gwpSet = await this.resolveGwpSet(ctx.gwpSetId, trace);
    if (!gwpSet) {
      errors.push({
        severity: 'ERROR',
        code: 'GWP_SET_MISSING',
        message:
          'No GWP set is configured as current. Maintain the GWP set in Master Data before calculating.',
      });
      return this.fail(ctx, trace, errors, warnings, runType);
    }
    const gwpValues = await this.gwpValueRepo.find({
      where: { gwpSetId: gwpSet.id },
    });
    const gwpMap = new Map<string, number>();
    for (const v of gwpValues)
      gwpMap.set(`${v.gasCode}:${v.methaneOrigin ?? ''}`, v.value);
    const gwpFor = (gas: string, methaneOrigin?: string): number | undefined =>
      gwpMap.get(`${gas}:${methaneOrigin ?? ''}`) ?? gwpMap.get(`${gas}:`);

    // ── 6. Gas-level calculation ─────────────────────────────────────────────
    const gasContributions: Record<string, number> = {};
    const gasRows: Array<{ gas: string; perUnit: number; gwp: number }> = [];

    const gasoline = (perUnit: number | null | undefined, gas: string) => {
      if (!perUnit) return;
      const origin =
        gas === 'CH4'
          ? factor.isFossilMethane
            ? 'FOSSIL'
            : 'NON_FOSSIL'
          : undefined;
      const gwp = gwpFor(gas, origin) ?? 1;
      gasRows.push({ gas, perUnit, gwp });
      gasContributions[gas] = perUnit * normalizedAmount * gwp;
      trace.push(
        `Gas ${gas}: ${perUnit} ${factor.unitBasis?.symbol || ''} × ${normalizedAmount} × GWP(${gwp}${origin ? `,${origin}` : ''}) = ${gasContributions[gas].toFixed(4)} kgCO2e`,
      );
    };

    gasoline(factor.co2Value, 'CO2');
    gasoline(factor.ch4Value, 'CH4');
    gasoline(factor.n2oValue, 'N2O');
    gasoline(factor.hfcValue, 'HFC');
    gasoline(factor.pfcValue, 'PFC');
    gasoline(factor.sf6Value, 'SF6');
    gasoline(factor.nf3Value, 'NF3');

    let totalKgCo2e: number;
    if (gasRows.length > 0) {
      totalKgCo2e = gasRows.reduce(
        (sum, r) => sum + r.perUnit * normalizedAmount * r.gwp,
        0,
      );
      trace.push(`Total = Σ gas×GWP×amount = ${totalKgCo2e.toFixed(4)} kgCO2e`);
    } else {
      totalKgCo2e = factor.factorValue * normalizedAmount;
      trace.push(
        `No gas breakdown on factor; total taken from factor value: ${factor.factorValue} × ${normalizedAmount} = ${totalKgCo2e.toFixed(4)} kgCO2e`,
      );
    }

    const totalEmission = totalKgCo2e / 1000; // kgCO2e → tCO2e (legacy formula parity)
    const biogenicCo2 = (factor.biogenicCo2Value || 0) * normalizedAmount;
    trace.push(
      `Net total: ${totalEmission.toFixed(6)} tCO2e (biogenic ${biogenicCo2.toFixed(4)} kgCO2e reported separately)`,
    );

    // ── 7. Persist run + result ──────────────────────────────────────────────
    const run = await this.runService.createRun(
      ctx.organizationId,
      runType,
      this.snapshot(ctx, factor),
      gwpSet.id,
      'ENGINE-1.0',
      ctx.parentRunId,
      ctx.reason,
    );
    const result = await this.runService.persistResult(run, {
      inventoryEntryId: ctx.inventoryEntryId,
      factorId: factor.id,
      gwpSetId: gwpSet.id,
      amountOriginal: ctx.amount,
      unitOriginal: ctx.unit,
      normalizedAmount,
      normalizedUnit,
      factorValue: factor.factorValue,
      co2Emission: gasContributions['CO2'] ?? 0,
      ch4Emission: gasContributions['CH4'] ?? 0,
      n2oEmission: gasContributions['N2O'] ?? 0,
      hfcEmission: gasContributions['HFC'] ?? 0,
      pfcEmission: gasContributions['PFC'] ?? 0,
      sf6Emission: gasContributions['SF6'] ?? 0,
      nf3Emission: gasContributions['NF3'] ?? 0,
      biogenicCo2,
      totalEmission,
      calculationTrace: trace,
      comment: ctx.reason,
    });

    trace.push(
      `Persisted: run#${run.id}, result#${result.id}, revision v${result.versionNumber}`,
    );
    this.logger.log(
      `Entry ${ctx.inventoryEntryId ?? 'new'} → ${totalEmission.toFixed(6)} tCO2e (run#${run.id})`,
    );

    return {
      ok: true,
      totalEmission,
      gasEmissions: gasContributions,
      biogenicCo2,
      factorId: factor.id,
      gwpSetId: gwpSet.id,
      calculationResultId: result.id,
      calculationRunId: run.id,
      factorVersionId: factor.factorVersionId,
      normalizedAmount,
      normalizedUnit,
      factorValue: factor.factorValue,
      fallbackUsed: resolved.fallbackUsed,
      fallbackReason: resolved.fallbackReason,
      warnings,
      errors,
      trace,
      runType,
    };
  }

  /**
   * Recalculates an existing draft entry (doc 23 §7 revision control):
   * builds context from the stored entry + its resolved factor, re-runs the
   * pipeline with runType RECALCULATE, and refreshes the entry's emission.
   */
  async recalcEntry(
    entryId: number,
    opts: { reason?: string; gwpSetId?: number; reportingYear?: number },
  ): Promise<PipelineOutcome & { pipelineMessage?: string }> {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId, isActive: true },
    });
    if (!entry) {
      return {
        ok: false,
        totalEmission: 0,
        gasEmissions: {},
        biogenicCo2: 0,
        fallbackUsed: false,
        warnings: [],
        errors: [
          {
            severity: 'ERROR',
            code: 'ENTRY_NOT_FOUND',
            message: `Inventory entry ${entryId} not found.`,
          },
        ],
        trace: ['Recalculation aborted: entry not found'],
        runType: 'RECALCULATE',
        pipelineMessage: `Inventory entry ${entryId} not found.`,
      };
    }

    const outcome = await this.run({
      organizationId: entry.organizationId,
      inventoryEntryId: entryId,
      category: entry.category,
      name: entry.name,
      amount: entry.amount,
      unit: entry.unit,
      factorVersionId: entry.factorVersionId,
      reportingYear: opts.reportingYear,
      gwpSetId: opts.gwpSetId,
      inclusionStatus: entry.inclusionStatus,
      runType: 'RECALCULATE',
      reason: opts.reason,
    });

    if (!outcome.ok) {
      return {
        ...outcome,
        pipelineMessage:
          'Recalculation not persisted. ' +
          outcome.errors.map((e) => e.message).join(' '),
      };
    }

    // Refresh the entry's emission + lineage (approved entries are immutable —
    // recalculation then requires a new revision through the services layer)
    const approved =
      !!entry.approvalStatus && /^approved$/i.test(entry.approvalStatus);
    if (!approved) {
      entry.emission = outcome.totalEmission;
      entry.factorId = outcome.factorId;
      entry.gwpSetId = outcome.gwpSetId;
      entry.calculationRunId = outcome.calculationRunId;
      entry.latestCalculationResultId = outcome.calculationResultId;
      await this.entryRepo.save(entry);
    }
    return outcome;
  }

  private async resolveGwpSet(
    requestedId?: number,
    trace: string[] = [],
  ): Promise<GwpSet | null> {
    if (requestedId) {
      const set = await this.gwpSetRepo.findOne({
        where: { id: requestedId, isActive: true },
      });
      if (set) {
        trace.push(
          `GWP set: ${set.name} (${set.assessment ?? ''}) requested explicitly`,
        );
        return set;
      }
    }
    const current = await this.gwpSetRepo
      .createQueryBuilder('gwp')
      .where('gwp.isCurrent = :isCurrent', { isCurrent: true })
      .andWhere('gwp.isActive = :isActive', { isActive: true })
      .getOne();
    if (current) {
      trace.push(
        `GWP set: ${current.name} (${current.assessment ?? ''}) marked current`,
      );
      return current;
    }
    const fallback = await this.gwpSetRepo.findOne({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
    if (fallback) {
      trace.push(
        `GWP set: no set marked current — using first active (${fallback.name})`,
      );
      return fallback;
    }
    return null;
  }

  private snapshot(
    ctx: PipelineContext,
    factor: EmissionFactor,
  ): RunInputSnapshot {
    return {
      organizationId: ctx.organizationId,
      inventoryEntryId: ctx.inventoryEntryId,
      category: ctx.category,
      name: ctx.name,
      amount: ctx.amount,
      unit: ctx.unit,
      factorId: factor.id,
      factorVersionId: factor.factorVersionId,
      gwpSetId: ctx.gwpSetId,
      reportingYear: ctx.reportingYear,
      geography: ctx.geography,
      basedOption: ctx.basedOption,
    };
  }

  private fail(
    ctx: PipelineContext,
    trace: string[],
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    runType: string,
    hardError?: string,
  ): PipelineOutcome {
    if (hardError) {
      errors.push({
        severity: 'ERROR',
        code: 'PIPELINE_BLOCKED',
        message: hardError,
      });
    }
    trace.push('Pipeline terminated: no calculation persisted');
    this.logger.warn(
      `Pipeline failed for ${ctx.name}: ${errors.map((e) => e.code).join('; ')}`,
    );
    return {
      ok: false,
      totalEmission: 0,
      gasEmissions: {},
      biogenicCo2: 0,
      fallbackUsed: false,
      warnings,
      errors,
      trace,
      runType,
    };
  }
}
