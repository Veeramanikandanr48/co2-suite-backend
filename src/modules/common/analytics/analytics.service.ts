import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BenchmarkDataset,
  EmissionSummary,
  ReducedTarget,
} from 'src/entities/reporting-analytics.entity';

export const SEED_REDUCED_TARGETS: Partial<ReducedTarget>[] = [
  {
    organizationId: 1,
    baselineYear: 2020,
    targetYear: 2030,
    scope: 'Scope 1+2+3',
    targetReductionPercent: 42.0,
    baselineCO2e: 25000.0,
    targetCO2e: 14500.0,
  },
];

export const SEED_BENCHMARK_DATASETS: Partial<BenchmarkDataset>[] = [
  {
    industrySector: 'Manufacturing & Industrial',
    reportingYear: 2024,
    scope1Average: 1250.0,
    scope2Average: 3800.0,
    scope3Average: 8900.0,
    intensityPerRevenue: 14.5,
    intensityPerHeadcount: 22.1,
  },
];

@Injectable()
export class AnalyticsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(ReducedTarget)
    private readonly targetRepo: Repository<ReducedTarget>,
    @InjectRepository(BenchmarkDataset)
    private readonly benchmarkRepo: Repository<BenchmarkDataset>,
    @InjectRepository(EmissionSummary)
    private readonly summaryRepo: Repository<EmissionSummary>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const targetCount = await this.targetRepo.count();
      if (targetCount === 0) {
        this.logger.log('Seeding Reduction Targets & Benchmark Datasets...');
        await this.targetRepo.save(SEED_REDUCED_TARGETS);
        await this.benchmarkRepo.save(SEED_BENCHMARK_DATASETS);
      }
    } catch (err) {
      this.logger.error('Failed to seed Analytics Targets', err);
    }
  }

  /**
   * Historical emission trend series per scope for an organization.
   */
  async getEmissionTrends(orgId: number, year: number = 2025) {
    const summaries = await this.summaryRepo.find({
      where: { organizationId: orgId, reportingYear: year },
    });

    const scopeMap: Record<string, number> = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
    for (const s of summaries) {
      scopeMap[s.scope] = (scopeMap[s.scope] || 0) + Number(s.totalCO2e);
    }

    return {
      year,
      totalEmissions: Object.values(scopeMap).reduce((a, b) => a + b, 0),
      scopeBreakdown: scopeMap,
      summaries,
    };
  }

  /**
   * 12-month linear projection forecast.
   */
  async get12MonthForecast(orgId: number) {
    const summaries = await this.summaryRepo.find({ where: { organizationId: orgId } });
    const totalCurrent = summaries.reduce((sum, s) => sum + Number(s.totalCO2e), 0);
    const monthlyAvg = totalCurrent > 0 ? totalCurrent / 12 : 500;

    const forecastMonths = [];
    for (let m = 1; m <= 12; m++) {
      // Apply subtle seasonal variation
      const seasonalFactor = 1 + 0.1 * Math.sin((m * Math.PI) / 6);
      forecastMonths.push({
        month: m,
        monthName: new Date(2026, m - 1, 1).toLocaleString('default', { month: 'short' }),
        projectedCO2e: Number((monthlyAvg * seasonalFactor).toFixed(2)),
      });
    }

    return {
      forecastHorizon: '12 Months',
      projectedAnnualTotal: forecastMonths.reduce((a, b) => a + b.projectedCO2e, 0),
      forecastMonths,
    };
  }

  /**
   * "What-if" carbon reduction simulation.
   */
  async runSimulation(
    orgId: number,
    dieselReductionPercent: number = 20,
    electricityReductionPercent: number = 15,
  ) {
    const summaries = await this.summaryRepo.find({ where: { organizationId: orgId } });
    const currentTotal = summaries.reduce((a, b) => a + Number(b.totalCO2e), 0);

    const estimatedSavings = currentTotal * ((dieselReductionPercent * 0.3 + electricityReductionPercent * 0.5) / 100);
    const simulatedTotal = Math.max(0, currentTotal - estimatedSavings);

    return {
      currentEmissionsCO2e: Number(currentTotal.toFixed(2)),
      simulatedEmissionsCO2e: Number(simulatedTotal.toFixed(2)),
      reductionCO2e: Number(estimatedSavings.toFixed(2)),
      reductionPercent: currentTotal > 0 ? Number(((estimatedSavings / currentTotal) * 100).toFixed(1)) : 0,
      parameters: { dieselReductionPercent, electricityReductionPercent },
    };
  }

  /**
   * Emission cost analysis at configurable carbon price ($/tCO2e).
   */
  async getCostAnalysis(orgId: number, carbonPricePerTonne: number = 85.0) {
    const summaries = await this.summaryRepo.find({ where: { organizationId: orgId } });
    const totalCO2e = summaries.reduce((a, b) => a + Number(b.totalCO2e), 0);
    const totalCost = totalCO2e * carbonPricePerTonne;

    return {
      totalCO2e: Number(totalCO2e.toFixed(2)),
      carbonPricePerTonne,
      totalCarbonCostUSD: Number(totalCost.toFixed(2)),
      costPerScope: {
        Scope1: Number((summaries.filter(s => s.scope === 'Scope 1').reduce((a, b) => a + Number(b.totalCO2e), 0) * carbonPricePerTonne).toFixed(2)),
        Scope2: Number((summaries.filter(s => s.scope === 'Scope 2').reduce((a, b) => a + Number(b.totalCO2e), 0) * carbonPricePerTonne).toFixed(2)),
        Scope3: Number((summaries.filter(s => s.scope === 'Scope 3').reduce((a, b) => a + Number(b.totalCO2e), 0) * carbonPricePerTonne).toFixed(2)),
      },
    };
  }

  /**
   * Ranked top-emitting activity hotspots by contribution percentage.
   */
  async getHotspots(orgId: number) {
    const summaries = await this.summaryRepo.find({ where: { organizationId: orgId } });
    const total = summaries.reduce((a, b) => a + Number(b.totalCO2e), 0);

    const sorted = [...summaries].sort((a, b) => Number(b.totalCO2e) - Number(a.totalCO2e));

    return sorted.map((item, index) => ({
      rank: index + 1,
      category: item.category,
      scope: item.scope,
      totalCO2e: Number(item.totalCO2e),
      contributionPercent: total > 0 ? Number(((Number(item.totalCO2e) / total) * 100).toFixed(1)) : 0,
    }));
  }

  /**
   * Target tracking: baseline vs target vs actual progress towards 2030 target.
   */
  async getTargetTracking(orgId: number) {
    const target = await this.targetRepo.findOne({ where: { organizationId: orgId } });
    const summaries = await this.summaryRepo.find({ where: { organizationId: orgId } });
    const currentActual = summaries.reduce((a, b) => a + Number(b.totalCO2e), 0);

    const baseline = target?.baselineCO2e || 25000;
    const targetVal = target?.targetCO2e || 14500;
    const reductionAchieved = Math.max(0, baseline - currentActual);
    const totalReductionNeeded = Math.max(1, baseline - targetVal);
    const progressPercent = Number(((reductionAchieved / totalReductionNeeded) * 100).toFixed(1));

    return {
      target,
      currentActualCO2e: Number(currentActual.toFixed(2)),
      reductionAchievedCO2e: Number(reductionAchieved.toFixed(2)),
      progressPercent: Math.min(100, progressPercent),
      isOnTrack: progressPercent >= 20,
    };
  }
}
