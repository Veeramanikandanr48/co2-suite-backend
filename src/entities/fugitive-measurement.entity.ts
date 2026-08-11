import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryActivity } from './inventory-activity.entity';
import { RefrigerationEquipment } from './refrigeration-equipment.entity';

@Entity({ name: 'fugitive_measurements' })
export class FugitiveMeasurement extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activityId: number;

  @ManyToOne(() => InventoryActivity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: InventoryActivity;

  @Column({ type: 'int' })
  refrigerationEquipmentId: number;

  @ManyToOne(() => RefrigerationEquipment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'refrigerationEquipmentId' })
  refrigerationEquipment: RefrigerationEquipment;

  @Column({ type: 'varchar', length: 50 })
  emissionMode: string; // DIRECT_RELEASE, RECHARGE_TOPUP, INVENTORY_DIFFERENCE, ESTIMATED_LEAKAGE

  @Column({ type: 'varchar', length: 50 })
  measurementType: string; // START_INV, PURCHASED, RECOVERED, END_INV, TOPUP_AMOUNT

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ type: 'int' })
  unitId: number;
}
