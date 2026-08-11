import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'inventory_entries' })
export class InventoryEntry extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

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

  /** Raw user entered activity amount before physical unit normalization */
  @Column({ type: 'float', nullable: true })
  originalAmount: number;

  /** Raw user entered activity unit before physical unit normalization */
  @Column({ type: 'varchar', nullable: true })
  originalUnit: string;

  /** Converted activity amount matching EF denominator unit */
  @Column({ type: 'float', nullable: true })
  normalizedAmount: number;

  /** Converted activity unit matching EF denominator unit */
  @Column({ type: 'varchar', nullable: true })
  normalizedUnit: string;

  /** Emission factor snapshot in kg CO₂e / unit */
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

  /** Total calculated greenhouse gas emission snapshot in metric tonnes CO₂e (tCO₂e) */
  @Column({ type: 'float', default: 0 })
  emission: number;

  /** Scope Classification snapshot (SCOPE_1, SCOPE_2, SCOPE_3) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  scopeType: string;

  /** Scope 3 Category Number snapshot (1-15) */
  @Column({ type: 'int', nullable: true })
  scope3CategoryNumber: number;

  /** Calculation methodology snapshot (FUEL_BASED, DISTANCE_BASED, SPEND_BASED, etc.) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  calculationMethod: string;

  @Column({ default: 'completed' })
  status: string; // 'completed', 'pending', 'draft'

  @Column({ type: 'varchar', nullable: true })
  comment: string;

  @Column({ type: 'varchar', nullable: true })
  approvalStatus: string;

  @Column({ type: 'varchar', nullable: true })
  documentPath: string;
}
