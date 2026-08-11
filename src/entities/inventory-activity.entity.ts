import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Facility } from './facility.entity';
import { Asset } from './asset.entity';
import { MasterActivityType } from './master-activity-type.entity';
import type { ActivityInput } from './activity-input.entity';
import type { ActivitySource } from './activity-source.entity';
import type { CalculationRun } from './calculation-run.entity';

@Entity({ name: 'inventory_activities' })
export class InventoryActivity extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'int' })
  reportingPeriodId: number;

  @Column({ type: 'int' })
  facilityId: number;

  @ManyToOne(() => Facility, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ type: 'int', nullable: true })
  assetId: number;

  @ManyToOne(() => Asset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'int' })
  activityTypeId: number;

  @ManyToOne(() => MasterActivityType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'activityTypeId' })
  activityType: MasterActivityType;

  @Column({ type: 'date' })
  activityDate: string;

  @Column({ type: 'date', nullable: true })
  activityEndDate: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: string; // DRAFT, CALCULATED, VERIFIED, LOCKED

  @OneToMany('ActivityInput', 'activity')
  inputs: ActivityInput[];

  @OneToMany('ActivitySource', 'activity')
  sources: ActivitySource[];

  @OneToMany('CalculationRun', 'activity')
  calculationRuns: CalculationRun[];
}
