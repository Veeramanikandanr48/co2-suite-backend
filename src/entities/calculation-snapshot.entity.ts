import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryEntry } from './inventory-entry.entity';
import { MasterItem } from './master-item.entity';

/**
 * CalculationSnapshot — The final immutable audit object.
 *
 * Architecture principle (ADR-v1.0):
 *   All revision IDs stored here are pinned to their exact immutable revision at
 *   the time of calculation. Inline copies of `factorValue` and `formulaExpression`
 *   are also persisted so the snapshot remains fully self-describing even if the
 *   underlying revision tables are migrated, renamed, or purged years later.
 *
 * Legal defensibility:
 *   - ISO 14064 audits require reproducible results tied to specific factor versions.
 *   - The SHA-256 `checksum` column allows auditors to verify snapshot integrity.
 *
 * This entity belongs to the Operations bounded context, NOT Master Data.
 */
@Entity({ name: 'calculation_snapshots' })
@Index(['inventoryEntryId'])
@Index(['organizationId', 'calculatedAt'])
export class CalculationSnapshot extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  inventoryEntryId: number;

  @ManyToOne(() => InventoryEntry, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'inventoryEntryId' })
  inventoryEntry: InventoryEntry;

  @Column({ type: 'int', nullable: true })
  organizationId: number;

  // ── Pinned Revision IDs ────────────────────────────────────────────────────

  /**
   * Pinned to the exact CalculationPolicy revision active at execution time.
   * Null-tolerant: early calculations may pre-date the policy engine.
   */
  @Column({ type: 'int', nullable: true })
  policyRevisionId: number;

  /**
   * Pinned to the exact EmissionFactorRevision used during this calculation.
   * Guarantees reproducibility when factors are updated after the fact.
   */
  @Column({ type: 'int', nullable: true })
  factorRevisionId: number;

  /**
   * Pinned to the exact FormulaRevision whose expression was evaluated.
   * The `formulaExpression` column below mirrors this for self-description.
   */
  @Column({ type: 'int', nullable: true })
  formulaRevisionId: number;

  /**
   * GWP version applied (AR4 / AR5 / AR6 / AR7).
   * Stored as a reference to MasterItem (GWP_VERSION type).
   */
  @Column({ type: 'int', nullable: true })
  gwpVersionId: number;

  @ManyToOne(() => MasterItem, { nullable: true, eager: false })
  @JoinColumn({ name: 'gwpVersionId' })
  gwpVersionItem: MasterItem;

  // ── Activity Input ─────────────────────────────────────────────────────────

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string;

  // ── Inline Immutable Value Copies ──────────────────────────────────────────

  /**
   * Exact totalEmissionFactor value resolved from the factor revision.
   * Preserved inline so the audit record survives factor table migrations.
   */
  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  factorValue: number;

  /**
   * Exact formula expression string evaluated at calculation time.
   * e.g. "(amount * factor) / 1000"
   * Preserved inline for ISO / legal audit trail.
   */
  @Column({ type: 'text', nullable: true })
  formulaExpression: string;

  /**
   * Strategy class name used (e.g. FuelCombustionStrategy).
   * Preserved inline alongside the expression for full auditability.
   */
  @Column({ type: 'varchar', nullable: true })
  strategyName: string;

  // ── Gas Breakdown ─────────────────────────────────────────────────────────

  /** JSONB snapshot: { CO2: float, CH4: float, N2O: float, SF6: float, ... } */
  @Column({ type: 'jsonb', nullable: true })
  gasBreakdown: Record<string, number>;

  /** JSONB snapshot of per-gas factor values at calculation time. */
  @Column({ type: 'jsonb', nullable: true })
  gasFactors: Record<string, number>;

  /** JSONB snapshot of GWP multipliers applied per gas: { CH4: 27.2, N2O: 273, ... } */
  @Column({ type: 'jsonb', nullable: true })
  gwpMultipliers: Record<string, number>;

  // ── Result ─────────────────────────────────────────────────────────────────

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  totalCO2e: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculatedAt: Date;

  /**
   * SHA-256 of the canonical JSON representation of this snapshot.
   * Used by auditors to verify the snapshot has not been tampered with
   * after the fact — fulfills ISO 14064 chain-of-custody requirements.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;
}
