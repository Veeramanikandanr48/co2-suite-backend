import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Asset } from './asset.entity';
import { MasterRefrigerant } from './master-refrigerant.entity';

@Entity({ name: 'refrigeration_equipment' })
export class RefrigerationEquipment extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  assetId: number;

  @OneToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'varchar', length: 100 })
  equipmentType: string; // CHILLER, HVAC, REFRIGERATED_VAN, HEAT_PUMP

  @Column({ type: 'int' })
  refrigerantId: number;

  @ManyToOne(() => MasterRefrigerant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'refrigerantId' })
  refrigerant: MasterRefrigerant;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  chargeCapacityKg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  normalLeakRatePct: number;
}
