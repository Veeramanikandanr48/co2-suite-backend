import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Formula } from './formula.entity';

/**
 * FormulaRevision: Immutable versioned snapshot of a formula's expression and strategy.
 * 
 * Architecture: Formula → FormulaRevision → FormulaStrategy
 *
 * A FormulaRevision binds a specific calculation expression version to a strategy class.
 * Calculations pin to formulaRevisionId — never to mutable formula records.
 * compiledHash supports cache invalidation in the calculation engine.
 */
@Entity({ name: 'formula_revisions' })
@Index(['formulaId', 'revisionNumber'], { unique: true })
export class FormulaRevision extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formulaId: number;

  @ManyToOne(() => Formula, (f) => f.revisions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formulaId' })
  formula: Formula;

  @Column({ type: 'int', default: 1 })
  revisionNumber: number;

  /**
   * Human-readable version label, e.g. "v3", "2024.1".
   * For display only — revisionNumber is the authoritative ordering key.
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  versionLabel: string;

  /** Calculation expression, e.g. "(amount * factor) / 1000". Stored for documentation and auditability. */
  @Column({ type: 'text' })
  expression: string;

  /**
   * Strategy class name that executes this revision's compiled logic.
   * e.g. FuelCombustionStrategy, GridElectricityStrategy, RefrigerantStrategy,
   *      PurchasedElectricityStrategy, PCAFStrategy, CBAMStrategy.
   */
  @Column({ type: 'varchar', length: 100, default: 'FuelCombustionStrategy' })
  strategy: string;

  @Column({ type: 'jsonb', nullable: true })
  inputParameters: string[];

  @Column({ type: 'varchar', nullable: true, default: 'kgCO2e' })
  outputUnit: string;

  /** SHA-256 hash of the compiled strategy bundle. Used for calculation engine cache invalidation. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  compiledHash: string;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'varchar', default: 'PUBLISHED' })
  status: string;
}
