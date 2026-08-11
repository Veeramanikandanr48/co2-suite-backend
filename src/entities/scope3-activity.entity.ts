import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryActivity } from './inventory-activity.entity';

@Entity({ name: 'scope3_activities' })
export class Scope3Activity extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  activityId: number;

  @OneToOne(() => InventoryActivity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: InventoryActivity;

  @Column({ type: 'int' })
  categoryNumber: number; // 1 to 15

  @Column({ type: 'varchar', length: 50, default: 'AVERAGE_DATA' })
  allocationMethod: string; // SUPPLIER_SPECIFIC, HYBRID, AVERAGE_DATA, SPEND_BASED

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplierName: string;
}
