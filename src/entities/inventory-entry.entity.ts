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

export enum InventoryStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  PENDING = 'pending',
}

export enum WorkflowState {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  MANAGER_APPROVED = 'MANAGER_APPROVED',
  SM_APPROVED = 'SM_APPROVED',
  LOCKED = 'LOCKED',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'inventory_entries' })
@Index(['organizationId', 'isActive'])
@Index(['organizationId', 'category'])
@Index(['organizationId', 'serviceCode'])
@Index(['workflowState'])
export class InventoryEntry extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  @Index()
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

  /**
   * Display name of the facility (denormalised for backward compatibility).
   * Use facilityId for relational joins.
   */
  @Column({ type: 'varchar', nullable: true })
  facility: string;

  /**
   * FK to Facility entity. Provides referential integrity and enables joins.
   * Nullable for backward compatibility with existing entries that only have facility string.
   */
  @Column({ type: 'int', nullable: true })
  facilityId: number;

  @ManyToOne(() => Facility, { nullable: true })
  @JoinColumn({ name: 'facilityId' })
  facilityEntity: Facility;

  @Column({ type: 'float', default: 0 })
  emission: number;

  /**
   * Operational status of the entry.
   * Backed by InventoryStatus enum for type safety.
   */
  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.COMPLETED,
  })
  status: InventoryStatus;

  @Column({ type: 'varchar', nullable: true })
  comment: string;

  @Column({ type: 'varchar', nullable: true })
  approvalStatus: string;

  @Column({ type: 'varchar', nullable: true })
  documentPath: string;

  /**
   * Current FSM workflow state for the approval pipeline.
   * Backed by WorkflowState enum.
   */
  @Column({
    type: 'enum',
    enum: WorkflowState,
    default: WorkflowState.DRAFT,
  })
  workflowState: WorkflowState;

  /**
   * Rejection reason populated when workflowState = REJECTED.
   */
  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string;

  /**
   * Timestamp when entry was LOCKED (calculation committed + snapshot sealed).
   * Null until the entry passes full approval.
   */
  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;
}
