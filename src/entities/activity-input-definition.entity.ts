import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterActivityType } from './master-activity-type.entity';
import type { MasterUnitDimension } from './master-unit-dimension.entity';

@Entity({ name: 'activity_input_definitions' })
@Unique(['activityTypeId', 'code'])
export class ActivityInputDefinition extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activityTypeId: number;

  @ManyToOne(() => MasterActivityType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityTypeId' })
  activityType: MasterActivityType;

  @Column({ type: 'varchar', length: 100 })
  code: string; // FUEL_QUANTITY, DISTANCE, PASSENGER_COUNT, SPEND_AMOUNT, REFRIGERANT_RECHARGED, etc.

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'NUMBER' })
  dataType: string; // NUMBER, STRING, BOOLEAN, ENUM

  @Column({ type: 'int', nullable: true })
  unitDimensionId: number;

  @ManyToOne('MasterUnitDimension', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unitDimensionId' })
  unitDimension: MasterUnitDimension;

  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validationSchema: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  displayOrder: number;
}
