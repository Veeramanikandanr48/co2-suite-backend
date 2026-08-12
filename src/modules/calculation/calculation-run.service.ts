import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculationRun } from 'src/entities/calculation-run.entity';
import { CalculationResult } from 'src/entities/calculation-result.entity';

export interface RunInputSnapshot {
  organizationId: number;
  inventoryEntryId?: number;
  category: string;
  name: string;
  amount: number;
  unit?: string;
  factorId?: number;
  factorVersionId?: number;
  gwpSetId?: number;
  reportingYear?: number;
  geography?: string;
  basedOption?: 'activity' | 'spend';
}

export interface ResultBody {
  inventoryEntryId?: number;
  factorId?: number;
  gwpSetId?: number;
  amountOriginal: number;
  unitOriginal?: string;
  normalizedAmount: number;
  normalizedUnit?: string;
  factorValue: number;
  co2Emission: number;
  ch4Emission: number;
  n2oEmission: number;
  hfcEmission: number;
  pfcEmission: number;
  sf6Emission: number;
  nf3Emission: number;
  biogenicCo2: number;
  totalEmission: number;
  calculationTrace: string[];
  comment?: string;
}

@Injectable()
export class CalculationRunService {
  constructor(
    @InjectRepository(CalculationRun)
    private readonly runRepo: Repository<CalculationRun>,
    @InjectRepository(CalculationResult)
    private readonly resultRepo: Repository<CalculationResult>,
  ) {}

  async createRun(
    organizationId: number,
    runType: string,
    input: RunInputSnapshot,
    gwpSetId?: number,
    engineVersion?: string,
    parentRunId?: number,
    reason?: string,
  ): Promise<CalculationRun> {
    const run = this.runRepo.create({
      organizationId,
      runType,
      engineVersion,
      methodologyVersion: engineVersion,
      gwpSetId,
      factorVersionId: input.factorVersionId,
      inputSnapshot: { ...input },
      parentRunId,
      reason,
      status: 'COMPLETED',
    });
    return this.runRepo.save(run);
  }

  /**
   * Persists a fresh result and demotes any previous latest result.
   * Every recalculation therefore produces a new version number
   * (doc 23 §7 revision control).
   */
  async persistResult(
    run: CalculationRun,
    body: ResultBody,
  ): Promise<CalculationResult> {
    const previousLatest = await this.resultRepo
      .createQueryBuilder('result')
      .where('result.inventoryEntryId = :entryId', {
        entryId: body.inventoryEntryId ?? -1,
      })
      .andWhere('result.isLatest = :isLatest', { isLatest: true })
      .getOne();

    const versionNumber = previousLatest ? previousLatest.versionNumber + 1 : 1;

    if (previousLatest) {
      previousLatest.isLatest = false;
      await this.resultRepo.save(previousLatest);
    }

    const result = this.resultRepo.create({
      calculationRunId: run.id,
      inventoryEntryId: body.inventoryEntryId,
      factorId: body.factorId,
      gwpSetId: body.gwpSetId,
      amountOriginal: body.amountOriginal,
      unitOriginal: body.unitOriginal,
      normalizedAmount: body.normalizedAmount,
      normalizedUnit: body.normalizedUnit,
      factorValue: body.factorValue,
      co2Emission: body.co2Emission,
      ch4Emission: body.ch4Emission,
      n2oEmission: body.n2oEmission,
      hfcEmission: body.hfcEmission,
      pfcEmission: body.pfcEmission,
      sf6Emission: body.sf6Emission,
      nf3Emission: body.nf3Emission,
      biogenicCo2: body.biogenicCo2,
      totalEmission: body.totalEmission,
      calculationTrace: body.calculationTrace,
      comment: body.comment,
      resultStatus: 'DRAFT',
      versionNumber,
      previousResultId: previousLatest ? previousLatest.id : undefined,
      isLatest: true,
    });
    return this.resultRepo.save(result);
  }

  async getRun(runId: number): Promise<CalculationRun | null> {
    return this.runRepo.findOne({
      where: { id: runId },
      relations: { gwpSet: true, results: true },
    });
  }

  async listRuns(
    organizationId: number,
    { status, runType }: { status?: string; runType?: string } = {},
  ): Promise<CalculationRun[]> {
    const qb = this.runRepo
      .createQueryBuilder('run')
      .where('run.organizationId = :organizationId', { organizationId })
      .orderBy('run.createdAt', 'DESC');
    if (status) qb.andWhere('run.status = :status', { status });
    if (runType) qb.andWhere('run.runType = :runType', { runType });
    return qb.getMany();
  }

  async getLatestResult(entryId: number): Promise<CalculationResult | null> {
    return this.resultRepo.findOne({
      where: { inventoryEntryId: entryId, isLatest: true },
      relations: { factor: true, gwpSet: true, calculationRun: true },
    });
  }

  async listResults(runId: number): Promise<CalculationResult[]> {
    return this.resultRepo.find({
      where: { calculationRunId: runId },
      order: { id: 'ASC' },
    });
  }

  async getResultHistory(entryId: number): Promise<CalculationResult[]> {
    return this.resultRepo.find({
      where: { inventoryEntryId: entryId },
      order: { versionNumber: 'DESC' },
    });
  }
}
