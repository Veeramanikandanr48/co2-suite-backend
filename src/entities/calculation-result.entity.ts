import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { CalculationRun } from './calculation-run.entity';
import type { InventoryEntry } from './inventory-entry.entity';
import type { EmissionFactor } from './emission-factor.entity';
import type { GwpSet } from './gwp-set.entity';

@Index('idx_calculation_result_entry_latest', [
  'inventoryEntryId',
  'isLatest',
])
@Index('idx_calculation_result_run', ['calculationRunId'])
@Entity({ name: 'calculation_results' })
export class CalculationResult extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  calculationRunId: number;

  @ManyToOne('CalculationRun', 'results', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calculationRunId' })
  calculationRun: CalculationRun;

  @Column({ type: 'int', nullable: true })
  inventoryEntryId: number;

  @ManyToOne('InventoryEntry', 'calculationResults', { nullable: true })
  @JoinColumn({ name: 'inventoryEntryId' })
  inventoryEntry: InventoryEntry;

  @Column({ type: 'int', nullable: true })
  factorId: number;

  @ManyToOne('EmissionFactor', { nullable: true })
  @JoinColumn({ name: 'factorId' })
  factor: EmissionFactor;

  @Column({ type: 'int', nullable: true })
  gwpSetId: number;

  @ManyToOne('GwpSet', { nullable: true })
  @JoinColumn({ name: 'gwpSetId' })
  gwpSet: GwpSet;

  @Column({ type: 'float', default: 0 })
  amountOriginal: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unitOriginal: string;

  @Column({ type: 'float', default: 0 })
  normalizedAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  normalizedUnit: string;

  @Column({ type: 'float', default: 0 })
  factorValue: number;

  @Column({ type: 'float', default: 0 })
  co2Emission: number;

  @Column({ type: 'float', default: 0 })
  ch4Emission: number;

  @Column({ type: 'float', default: 0 })
  n2oEmission: number;

  @Column({ type: 'float', default: 0 })
  hfcEmission: number;

  @Column({ type: 'float', default: 0 })
  pfcEmission: number;

  @Column({ type: 'float', default: 0 })
  sf6Emission: number;

  @Column({ type: 'float', default: 0 })
  nf3Emission: number;

  @Column({ type: 'float', default: 0 })
  biogenicCo2: number;

  @Column({ type: 'float', default: 0 })
  totalEmission: number;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  resultStatus: string; // DRAFT | SUBMITTED | VALIDATED | APPROVED | REJECTED

  @Column({ type: 'jsonb', nullable: true })
  calculationTrace: string[];

  @Column({ type: 'int', default: 1 })
  versionNumber: number;

  @Column({ type: 'int', nullable: true })
  previousResultId: number;

  @ManyToOne('CalculationResult', { nullable: true })
  @JoinColumn({ name: 'previousResultId' })
  previousResult: CalculationResult;

  @Column({ type: 'boolean', default: true })
  isLatest: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comment: string;
}