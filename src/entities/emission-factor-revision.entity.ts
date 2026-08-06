import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { EmissionFactor } from './emission-factor.entity';

/**
 * EmissionFactorRevision: Immutable, integrity-verified history of every change
 * to an EmissionFactor record.
 *
 * Enables:
 *  - Full audit trail with changeReason and changedBy
 *  - Instant rollback via supersededByRevision
 *  - Tamper-proof verification via SHA-256 checksum
 *  - Reproducible historical calculations (snapshot + formulaRevisionId pinned)
 */
@Entity({ name: 'emission_factor_revisions' })
@Index(['emissionFactorId', 'revisionNumber'], { unique: true })
export class EmissionFactorRevision extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emissionFactorId: number;

  @ManyToOne(() => EmissionFactor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emissionFactorId' })
  emissionFactor: EmissionFactor;

  @Column({ type: 'int', default: 1 })
  revisionNumber: number;

  @Column({ type: 'varchar', nullable: true, default: 'UPDATE' })
  changeType: string; // CREATE, UPDATE, DEPRECATE, RESTORE

  @Column({ type: 'varchar', nullable: true })
  changeReason: string;

  @Column({ type: 'varchar', nullable: true })
  changedBy: string;

  @Column('decimal', { precision: 18, scale: 8, default: 1.0 })
  totalEmissionFactor: number;

  @Column({ type: 'int', nullable: true })
  formulaRevisionId: number;

  @Column({ type: 'int', nullable: true })
  gwpVersionId: number;

  @Column({ type: 'varchar', nullable: true })
  effectiveFrom: string;

  @Column({ type: 'varchar', nullable: true })
  effectiveTo: string;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  /** Timestamp when this revision became publicly visible (PUBLISHED state). */
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  /** Points to the revision that replaced this one. Null = currently active. */
  @Column({ type: 'int', nullable: true })
  supersededByRevision: number;

  @Column({ type: 'jsonb', nullable: true })
  snapshot: Record<string, any>;

  /** SHA-256 of the canonical snapshot JSON for tamper-proof audit verification. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;
}
