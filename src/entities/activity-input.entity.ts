import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryActivity } from './inventory-activity.entity';
import { ActivityInputDefinition } from './activity-input-definition.entity';

@Entity({ name: 'activity_inputs' })
@Unique(['activityId', 'inputDefinitionId'])
export class ActivityInput extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activityId: number;

  @ManyToOne(() => InventoryActivity, (a) => a.inputs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: InventoryActivity;

  @Column({ type: 'int' })
  inputDefinitionId: number;

  @ManyToOne(() => ActivityInputDefinition, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inputDefinitionId' })
  inputDefinition: ActivityInputDefinition;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  rawValue: number;

  @Column({ type: 'int', nullable: true })
  unitId: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
