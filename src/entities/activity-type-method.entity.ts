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
import { MasterCalculationMethod } from './master-calculation-method.entity';

@Entity({ name: 'activity_type_methods' })
@Unique(['activityTypeId', 'calculationMethodId'])
export class ActivityTypeMethod extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activityTypeId: number;

  @ManyToOne(() => MasterActivityType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityTypeId' })
  activityType: MasterActivityType;

  @Column({ type: 'int' })
  calculationMethodId: number;

  @ManyToOne(() => MasterCalculationMethod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calculationMethodId' })
  calculationMethod: MasterCalculationMethod;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 1 })
  priority: number;
}
