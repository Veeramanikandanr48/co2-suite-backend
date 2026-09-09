import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterEmissionFactor } from './master-emission-factor.entity';
import type { MasterFormula } from './master-formula.entity';
import type { InventoryAuditEvent } from './inventory-audit-event.entity';
import { MrvStatusEnum } from '../enums/mrv-status.enum';

@Entity({ name: 'inventory_entries' })
export class InventoryEntry extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  organizationId: number;

  @Index()
  @Column({ default: 'CARBON' })
  serviceCode: string;

  @Column({ type: 'varchar' })
  category: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'varchar' })
  name: string; // e.g. 'Natural Gas'

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string;

  /** Snapshot of the emission factor value at the time of save.
   *  Must NOT be updated retroactively even if the source EF changes. */
  @Column({ type: 'float', default: 0 })
  ef: number;

  @Column({ type: 'varchar', nullable: true })
  efSource: string;

  @Column({ type: 'varchar', nullable: true })
  dateFrom: string;

  @Column({ type: 'varchar', nullable: true })
  dateTo: string;

  @Column({ type: 'varchar', nullable: true })
  facility: string;

  /** Total tCO2e emission calculated at save time. */
  @Column({ type: 'float', default: 0 })
  emission: number;

  @Column({ default: 'completed' })
  status: string; // 'completed', 'pending', 'draft'

  @Column({ type: 'varchar', nullable: true })
  comment: string;

  @Column({ type: 'varchar', nullable: true })
  approvalStatus: string;

  @Column({ type: 'varchar', nullable: true })
  documentPath: string;

  // ─── MRV Governance & Lifecycle ───────────────────────────────────────────

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    default: MrvStatusEnum.DRAFT,
  })
  mrvStatus: MrvStatusEnum;

  @Column({ type: 'int', nullable: true })
  verifiedBy: number | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  lockedBy: number | null;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date | null;

  @OneToMany('InventoryAuditEvent', 'inventoryEntry')
  auditEvents: InventoryAuditEvent[];

  // ─── NEW: Data-driven calculation audit trail ──────────────────────────────

  /** FK to the specific MasterEmissionFactor row used for this calculation.
   *  Provides full provenance: datasource, version, fuel, unit, method.
   *  Null for entries created before the dynamic EF system was introduced. */
  @Column({ type: 'int', nullable: true })
  emissionFactorId: number | null;

  @ManyToOne('MasterEmissionFactor', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'emissionFactorId' })
  masterEmissionFactor: MasterEmissionFactor;

  /** FK to the MasterFormula that was applied (e.g. FUEL_BASED, DISTANCE_WEIGHT).
   *  Null for legacy entries. */
  @Column({ type: 'int', nullable: true })
  formulaId: number | null;

  @ManyToOne('MasterFormula', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'formulaId' })
  masterFormula: MasterFormula;

  /** Calculation method code snapshot (e.g. FUEL_BASED, DISTANCE_BASED, SPEND_EEIO).
   *  Stored as a string so the audit trail is self-contained even if the formula is later deleted. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  calculationMethod: string | null;

  /** Activity sub-type at the time of save.
   *  e.g. economy | business | short-haul | long-haul | landfill */
  @Column({ type: 'varchar', length: 100, nullable: true })
  activitySubType: string | null;

  // ─── NEW: Gas species breakdown (tCO2e) ───────────────────────────────────

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  co2Tco2e: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  ch4Tco2e: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  n2oTco2e: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  hfcTco2e: number | null;

  // ─── NEW: Scope 2 dual reporting ───────────────────────────────────────────

  /** Location-based tCO2e (grid average). Scope 2 only. */
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  locationBasedTco2e: number | null;

  /** Market-based tCO2e (contractual). Scope 2 only. */
  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  marketBasedTco2e: number | null;
}
