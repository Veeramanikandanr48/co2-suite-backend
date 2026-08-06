import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmissionSummary,
  ReportDefinition,
  ReportExecution,
  ReportExecutionStatus,
  ReportType,
} from 'src/entities/reporting-analytics.entity';
import { AggregationService } from './aggregation.service';

export const SEED_REPORT_DEFINITIONS: Partial<ReportDefinition>[] = [
  {
    name: 'Annual GHG Corporate Report 2025',
    reportType: ReportType.ANNUAL_GHG,
    outputFormat: 'PDF',
    filterConfigJson: JSON.stringify({ year: 2025, scopes: ['Scope 1', 'Scope 2', 'Scope 3'] }),
  },
  {
    name: 'Scope 1, 2, 3 Emissions Breakdown',
    reportType: ReportType.SCOPE_BREAKDOWN,
    outputFormat: 'EXCEL',
    filterConfigJson: JSON.stringify({ year: 2025 }),
  },
  {
    name: 'Facility Level Summary Report',
    reportType: ReportType.FACILITY_SUMMARY,
    outputFormat: 'PDF',
    filterConfigJson: JSON.stringify({ year: 2025 }),
  },
  {
    name: 'Auditor Compliance & Lineage Report',
    reportType: ReportType.AUDIT_REPORT,
    outputFormat: 'PDF',
    filterConfigJson: JSON.stringify({ year: 2025, includeSnapshots: true }),
  },
  {
    name: 'Year-over-Year (YoY) Comparison',
    reportType: ReportType.YOY_COMPARISON,
    outputFormat: 'EXCEL',
    filterConfigJson: JSON.stringify({ years: [2024, 2025] }),
  },
];

@Injectable()
export class ReportingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    @InjectRepository(ReportDefinition)
    private readonly definitionRepo: Repository<ReportDefinition>,
    @InjectRepository(ReportExecution)
    private readonly executionRepo: Repository<ReportExecution>,
    @InjectRepository(EmissionSummary)
    private readonly summaryRepo: Repository<EmissionSummary>,
    private readonly aggregationService: AggregationService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const count = await this.definitionRepo.count();
      if (count === 0) {
        this.logger.log('Seeding default Report Definitions...');
        await this.definitionRepo.save(SEED_REPORT_DEFINITIONS);
      }
    } catch (err) {
      this.logger.error('Failed to seed Report Definitions', err);
    }
  }

  async getReportDefinitions(orgId?: number): Promise<ReportDefinition[]> {
    const query = this.definitionRepo.createQueryBuilder('def').where('def.isActive = :isActive', { isActive: true });
    if (orgId) {
      query.andWhere('(def.organizationId = :orgId OR def.organizationId IS NULL)', { orgId });
    }
    return query.getMany();
  }

  async createReportDefinition(dto: Partial<ReportDefinition>): Promise<ReportDefinition> {
    const entity = this.definitionRepo.create(dto);
    return this.definitionRepo.save(entity);
  }

  async executeReport(definitionId: number, userId: number): Promise<{
    executionId: number;
    status: ReportExecutionStatus;
    summaryData: EmissionSummary[];
    reportName: string;
  }> {
    const startTime = Date.now();
    const definition = await this.definitionRepo.findOne({ where: { id: definitionId } });
    if (!definition) {
      throw new Error(`Report definition ${definitionId} not found`);
    }

    const orgId = definition.organizationId || 1;

    // Ensure summaries are up to date
    await this.aggregationService.recomputeSummaryForOrg(orgId);

    const summaries = await this.summaryRepo.find({
      where: { organizationId: orgId },
      order: { scope: 'ASC', category: 'ASC' },
    });

    const executionTimeMs = Date.now() - startTime;

    const execution = this.executionRepo.create({
      reportDefinitionId: definitionId,
      triggeredByUserId: userId,
      status: ReportExecutionStatus.COMPLETED,
      outputPath: `/uploads/reports/report-${definitionId}-${Date.now()}.${definition.outputFormat.toLowerCase()}`,
      executionTimeMs,
    });

    const savedExecution = await this.executionRepo.save(execution);

    return {
      executionId: savedExecution.id,
      status: ReportExecutionStatus.COMPLETED,
      summaryData: summaries,
      reportName: definition.name,
    };
  }

  async getReportExecutions(definitionId: number): Promise<ReportExecution[]> {
    return this.executionRepo.find({
      where: { reportDefinitionId: definitionId },
      order: { createdAt: 'DESC' },
    });
  }
}
