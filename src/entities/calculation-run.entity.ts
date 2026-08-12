import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { GwpSet } from './gwp-set.entity';
import type { CalculationResult } from './calculation-result.entity';

@Index('idx_calculation_run_org', ['organizationId', 'createdAt'])
@Entity({ name: 'calculation_runs' })
export class CalculationRun extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'varchar', length: 50, default: 'SAVE' })
  runType: string; // SAVE | UPDATE | RECALCULATE | RETRO

  @Column({ type: 'varchar', length: 50, nullable: true })
  engineVersion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  methodologyVersion: string;

  @Column({ type: 'int', nullable: true })
  gwpSetId: number;

  @ManyToOne('GwpSet', { nullable: true })
  @JoinColumn({ name: 'gwpSetId' })
  gwpSet: GwpSet;

  @Column({ type: 'int', nullable: true })
  factorVersionId: number;

  @Column({ type: 'jsonb', nullable: true })
  inputSnapshot: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  resultSummary: Record<string, unknown>;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: string;

  @Column({ type: 'int', nullable: true })
  parentRunId: number;

  @ManyToOne('CalculationRun', { nullable: true })
  @JoinColumn({ name: 'parentRunId' })
  parentRun: CalculationRun;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string;

  @OneToMany('CalculationResult', 'calculationRun')
  results: CalculationResult[];
}