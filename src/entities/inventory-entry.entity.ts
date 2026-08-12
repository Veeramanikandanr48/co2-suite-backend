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
import type { EmissionFactor } from './emission-factor.entity';
import type { GwpSet } from './gwp-set.entity';
import type { CalculationResult } from './calculation-result.entity';

@Index('idx_inventory_org_category', ['organizationId', 'category'])
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

  @Column({ type: 'float', default: 0 })
  emission: number;

  @Column({ default: 'completed' })
  status: string; // 'completed', 'pending', 'draft'

  @Column({ type: 'varchar', nullable: true })
  comment: string;

  @Column({ type: 'varchar', nullable: true })
  approvalStatus: string;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string;

  @Column({ type: 'varchar', nullable: true })
  documentPath: string;

  // ─── Enterprise GHG lineage columns ───────────────────────────────────────

  @Column({ type: 'int', nullable: true })
  scopeNumber: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number;

  @Column({ type: 'int', nullable: true })
  factorId: number;

  @ManyToOne('EmissionFactor', { nullable: true })
  @JoinColumn({ name: 'factorId' })
  factor: EmissionFactor;

  @Column({ type: 'int', nullable: true })
  factorVersionId: number;

  @Column({ type: 'int', nullable: true })
  gwpSetId: number;

  @ManyToOne('GwpSet', { nullable: true })
  @JoinColumn({ name: 'gwpSetId' })
  gwpSet: GwpSet;

  @Column({ type: 'int', nullable: true })
  calculationRunId: number;

  @Column({ type: 'int', nullable: true })
  latestCalculationResultId: number;

  @ManyToOne('CalculationResult', { nullable: true })
  @JoinColumn({ name: 'latestCalculationResultId' })
  latestCalculationResult: CalculationResult;

  @Column({ type: 'varchar', length: 50, default: 'INCLUDED' })
  inclusionStatus: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reportingBasis: string; // LOCATION_BASED | MARKET_BASED

  @Column({ type: 'varchar', length: 50, nullable: true })
  dataQuality: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  methodology: string;

  @OneToMany('CalculationResult', 'inventoryEntry')
  calculationResults: CalculationResult[];
}