import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterItem } from './master-item.entity';

@Entity({ name: 'activity_category_fuel_types' })
@Index(['activityCategoryId', 'fuelGasTypeId'], { unique: true })
export class ActivityCategoryFuelType extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activityCategoryId: number;

  @ManyToOne(() => MasterItem, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'activityCategoryId' })
  activityCategory: MasterItem;

  @Column()
  fuelGasTypeId: number;

  @ManyToOne(() => MasterItem, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'fuelGasTypeId' })
  fuelGasType: MasterItem;
}
