import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Facility } from './facility.entity';
import { Organization } from './organization.entity';

// ============================================================================
// 1. PRE-COMPUTED EMISSION SUMMARIES (OLAP Data Warehouse aggregation)
// ============================================================================

@Entity({ name: 'emission_summaries' })
@Index(['organizationId', 'reportingYear', 'scope'])
@Index(['organizationId', 'facilityId'])
export class EmissionSummary extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'int', default: 2025 })
  reportingYear: number; // e.g. 2025

  @Column({ type: 'int', default: 0 })
  reportingMonth: number; // 1-12, or 0 for full year summary

  @Column({ type: 'varchar', nullable: true })
  scope: string; // 'Scope 1', 'Scope 2', 'Scope 3'

  @Column({ type: 'varchar', nullable: true })
  category: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'int', nullable: true })
  facilityId: number;

  @ManyToOne(() => Facility, { nullable: true })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ type: 'float', default: 0 })
  totalCO2e: number;

  @Column({ type: 'float', default: 0 })
  co2Emissions: number;

  @Column({ type: 'float', default: 0 })
  ch4Emissions: number;

  @Column({ type: 'float', default: 0 })
  n2oEmissions: number;

  @Column({ type: 'float', default: 0 })
  otherGasesEmissions: number;

  @Column({ type: 'int', default: 0 })
  entryCount: number;
}

// ============================================================================
// 2. REPORT DEFINITIONS & EXECUTIONS
// ============================================================================

export enum ReportType {
  ANNUAL_GHG = 'ANNUAL_GHG',
  SCOPE_BREAKDOWN = 'SCOPE_BREAKDOWN',
  FACILITY_SUMMARY = 'FACILITY_SUMMARY',
  AUDIT_REPORT = 'AUDIT_REPORT',
  YOY_COMPARISON = 'YOY_COMPARISON',
  INTENSITY_METRICS = 'INTENSITY_METRICS',
}

export enum ReportExecutionStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'report_definitions' })
export class ReportDefinition extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  name: string; // e.g. 'Annual GHG Corporate Report 2025'

  @Column({
    type: 'enum',
    enum: ReportType,
    default: ReportType.ANNUAL_GHG,
  })
  reportType: ReportType;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'text', nullable: true })
  filterConfigJson: string; // JSON: { year: 2025, scopes: ['Scope 1','Scope 2'], facilityIds: [1,2] }

  @Column({ type: 'varchar', default: 'PDF' })
  outputFormat: string; // 'PDF' | 'EXCEL' | 'JSON'

  @Column({ type: 'varchar', nullable: true })
  scheduleCron: string; // e.g. '0 0 1 * *' for monthly report
}

@Entity({ name: 'report_executions' })
@Index(['reportDefinitionId'])
export class ReportExecution extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  reportDefinitionId: number;

  @ManyToOne(() => ReportDefinition, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reportDefinitionId' })
  reportDefinition: ReportDefinition;

  @Column({ type: 'int', nullable: true })
  triggeredByUserId: number;

  @Column({
    type: 'enum',
    enum: ReportExecutionStatus,
    default: ReportExecutionStatus.PENDING,
  })
  status: ReportExecutionStatus;

  @Column({ type: 'varchar', nullable: true })
  outputPath: string; // Saved PDF/Excel file path under uploads/reports/

  @Column({ type: 'int', nullable: true })
  executionTimeMs: number;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string;
}

// ============================================================================
// 3. ANALYTICS: REDUCTION TARGETS & BENCHMARKS
// ============================================================================

@Entity({ name: 'reduced_targets' })
@Index(['organizationId', 'targetYear'])
export class ReducedTarget extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  @Column({ type: 'int', default: 2020 })
  baselineYear: number; // e.g. 2020

  @Column({ type: 'int', default: 2030 })
  targetYear: number; // e.g. 2030

  @Column({ type: 'varchar', default: 'Scope 1+2+3' })
  scope: string;

  @Column({ type: 'float', default: 42.0 })
  targetReductionPercent: number; // e.g. 42.0 % reduction

  @Column({ type: 'float', default: 0 })
  baselineCO2e: number; // Baseline total emissions

  @Column({ type: 'float', default: 0 })
  targetCO2e: number; // Target total emissions (baseline * (1 - targetReductionPercent/100))
}

@Entity({ name: 'benchmark_datasets' })
@Index(['industrySector', 'reportingYear'])
export class BenchmarkDataset extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  industrySector: string; // e.g. 'Manufacturing', 'Technology', 'Financial Services'

  @Column({ type: 'int', default: 2024 })
  reportingYear: number; // e.g. 2024

  @Column({ type: 'float', default: 0 })
  scope1Average: number;

  @Column({ type: 'float', default: 0 })
  scope2Average: number;

  @Column({ type: 'float', default: 0 })
  scope3Average: number;

  @Column({ type: 'float', nullable: true })
  intensityPerRevenue: number; // tCO2e per $M revenue

  @Column({ type: 'float', nullable: true })
  intensityPerHeadcount: number; // tCO2e per employee
}
