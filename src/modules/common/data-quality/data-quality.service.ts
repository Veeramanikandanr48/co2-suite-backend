import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  ActivitySupplementaryValue,
  ConfidenceLevel,
  DataQualityResult,
  DataQualityRule,
  DataQualityScore,
  RuleSeverity,
  RuleValidationStatus,
} from 'src/entities/data-quality.entity';

export const SEED_DATA_QUALITY_RULES: Partial<DataQualityRule>[] = [
  {
    code: 'REQ_AMOUNT',
    name: 'Required Amount Check',
    description: 'Verifies that activity amount is provided and greater than zero',
    ruleType: 'REQUIRED_FIELD',
    severity: RuleSeverity.ERROR,
    scoreDeduction: 40,
  },
  {
    code: 'EF_MATCH_CHECK',
    name: 'Emission Factor Match Check',
    description: 'Verifies that a non-zero emission factor is assigned to the entry',
    ruleType: 'EF_LOOKUP',
    severity: RuleSeverity.ERROR,
    scoreDeduction: 30,
  },
  {
    code: 'UNIT_MATCH_CHECK',
    name: 'Unit Consistency Check',
    description: 'Verifies that unit of measurement is specified',
    ruleType: 'UNIT_MATCH',
    severity: RuleSeverity.WARN,
    scoreDeduction: 15,
  },
  {
    code: 'PERIOD_CHECK',
    name: 'Reporting Period Validity Check',
    description: 'Verifies that dateFrom and dateTo are present',
    ruleType: 'REQUIRED_FIELD',
    severity: RuleSeverity.WARN,
    scoreDeduction: 15,
  },
];

@Injectable()
export class DataQualityService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DataQualityService.name);

  constructor(
    @InjectRepository(DataQualityRule)
    private readonly ruleRepo: Repository<DataQualityRule>,
    @InjectRepository(DataQualityResult)
    private readonly resultRepo: Repository<DataQualityResult>,
    @InjectRepository(DataQualityScore)
    private readonly scoreRepo: Repository<DataQualityScore>,
    @InjectRepository(InventoryEntry)
    private readonly inventoryRepo: Repository<InventoryEntry>,
    @InjectRepository(ActivitySupplementaryValue)
    private readonly suppValRepo: Repository<ActivitySupplementaryValue>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const ruleCount = await this.ruleRepo.count();
      if (ruleCount === 0) {
        this.logger.log('Seeding Data Quality Rules...');
        await this.ruleRepo.save(SEED_DATA_QUALITY_RULES);
      }
    } catch (err) {
      this.logger.error('Failed to seed Data Quality Rules', err);
    }
  }

  /**
   * Runs all active data quality rules against an inventory entry, computes confidence score,
   * and saves DataQualityResult and DataQualityScore records.
   */
  async validateEntry(entryId: number): Promise<{
    score: number;
    confidenceLevel: ConfidenceLevel;
    results: DataQualityResult[];
  }> {
    const entry = await this.inventoryRepo.findOne({ where: { id: entryId } });
    if (!entry) {
      throw new Error(`Inventory entry with ID ${entryId} not found`);
    }

    const rules = await this.ruleRepo.find({ where: { isActive: true } });
    let totalDeduction = 0;
    let passedCount = 0;
    let failedCount = 0;
    let warningCount = 0;

    // Delete existing validation results for this entry before re-evaluating
    await this.resultRepo.delete({ inventoryEntryId: entryId });

    const resultsToSave: Partial<DataQualityResult>[] = [];

    for (const rule of rules) {
      let status = RuleValidationStatus.PASS;
      let message = `${rule.name}: Passed`;

      switch (rule.code) {
        case 'REQ_AMOUNT':
          if (!entry.amount || Number(entry.amount) <= 0) {
            status = RuleValidationStatus.FAIL;
            message = 'Activity amount must be a positive number greater than 0';
          }
          break;

        case 'EF_MATCH_CHECK':
          if (!entry.ef || Number(entry.ef) <= 0) {
            status = RuleValidationStatus.FAIL;
            message = 'No matching emission factor found or factor is 0';
          }
          break;

        case 'UNIT_MATCH_CHECK':
          if (!entry.unit || !entry.unit.trim()) {
            status = RuleValidationStatus.WARN;
            message = 'Unit of measurement is missing';
          }
          break;

        case 'PERIOD_CHECK':
          if (!entry.dateFrom || !entry.dateTo) {
            status = RuleValidationStatus.WARN;
            message = 'Reporting period (dateFrom / dateTo) is missing';
          }
          break;
      }

      if (status === RuleValidationStatus.PASS) {
        passedCount++;
      } else if (status === RuleValidationStatus.FAIL) {
        failedCount++;
        totalDeduction += rule.scoreDeduction;
      } else if (status === RuleValidationStatus.WARN) {
        warningCount++;
        totalDeduction += rule.scoreDeduction;
      }

      resultsToSave.push({
        inventoryEntryId: entryId,
        ruleId: rule.id,
        ruleCode: rule.code,
        status,
        message,
      });
    }

    const savedResults = await this.resultRepo.save(resultsToSave);

    const calculatedScore = Math.max(0, Math.min(100, 100 - totalDeduction));
    let confidenceLevel = ConfidenceLevel.HIGH;
    if (calculatedScore < 50) {
      confidenceLevel = ConfidenceLevel.LOW;
    } else if (calculatedScore < 80) {
      confidenceLevel = ConfidenceLevel.MEDIUM;
    }

    // Save or update DataQualityScore
    let scoreEntity = await this.scoreRepo.findOne({ where: { inventoryEntryId: entryId } });
    if (scoreEntity) {
      scoreEntity.score = calculatedScore;
      scoreEntity.confidenceLevel = confidenceLevel;
      scoreEntity.passedRulesCount = passedCount;
      scoreEntity.failedRulesCount = failedCount;
      scoreEntity.warningRulesCount = warningCount;
    } else {
      scoreEntity = this.scoreRepo.create({
        inventoryEntryId: entryId,
        organizationId: entry.organizationId,
        score: calculatedScore,
        confidenceLevel,
        passedRulesCount: passedCount,
        failedRulesCount: failedCount,
        warningRulesCount: warningCount,
      });
    }

    await this.scoreRepo.save(scoreEntity);

    return {
      score: calculatedScore,
      confidenceLevel,
      results: savedResults,
    };
  }

  async getValidationResults(entryId: number) {
    const score = await this.scoreRepo.findOne({ where: { inventoryEntryId: entryId } });
    const results = await this.resultRepo.find({ where: { inventoryEntryId: entryId } });
    return { score, results };
  }

  async saveSupplementaryValues(
    entryId: number,
    values: Array<{ fieldKey: string; value: string; fieldDefinitionId?: number }>,
  ) {
    const toSave = values.map((v) => ({
      inventoryEntryId: entryId,
      fieldKey: v.fieldKey,
      value: v.value,
      fieldDefinitionId: v.fieldDefinitionId,
    }));
    return this.suppValRepo.save(toSave);
  }

  async getSupplementaryValues(entryId: number) {
    return this.suppValRepo.find({ where: { inventoryEntryId: entryId } });
  }
}
