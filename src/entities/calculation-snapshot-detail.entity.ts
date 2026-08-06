import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { CalculationSnapshot } from './calculation-snapshot.entity';

/**
 * CalculationSnapshotDetail — Heavy Audit Trail Storage (ADR-SRP Optimization)
 *
 * Architecture principle:
 *   Keeps the primary `CalculationSnapshot` table small (~80 bytes per row) for fast
 *   reporting aggregations (GHG Scope 1, 2, 3 totals across millions of rows).
 *   Heavy JSONB audit details (gas breakdowns, GWP multiplier maps, raw expressions,
 *   and SHA-256 legal checksums) are stored in this dedicated detail table, queried
 *   only when an auditor inspects an explicit calculation.
 */
@Entity({ name: 'calculation_snapshot_details' })
export class CalculationSnapshotDetail extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  snapshotId: number;

  @OneToOne(() => CalculationSnapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'snapshotId' })
  snapshot: CalculationSnapshot;

  /** Exact formula expression evaluated (e.g. "(amount * factor) / 1000") */
  @Column({ type: 'text', nullable: true })
  formulaExpression: string;

  /** Strategy class evaluated (e.g. FuelCombustionStrategy) */
  @Column({ type: 'varchar', nullable: true })
  strategyName: string;

  /** JSONB snapshot: { CO2: float, CH4: float, N2O: float, SF6: float, ... } */
  @Column({ type: 'jsonb', nullable: true })
  gasBreakdown: Record<string, number>;

  /** JSONB snapshot of per-gas factor values at calculation time. */
  @Column({ type: 'jsonb', nullable: true })
  gasFactors: Record<string, number>;

  /** JSONB snapshot of GWP multipliers applied per gas: { CH4: 27.2, N2O: 273, ... } */
  @Column({ type: 'jsonb', nullable: true })
  gwpMultipliers: Record<string, number>;

  /**
   * SHA-256 of the canonical JSON representation of this snapshot.
   * Fulfills ISO 14064 chain-of-custody requirements.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;
}
