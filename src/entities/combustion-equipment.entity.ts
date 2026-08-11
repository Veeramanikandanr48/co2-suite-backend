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
import { MasterFuel } from './master-fuel.entity';

@Entity({ name: 'combustion_equipment' })
export class CombustionEquipment extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  assetId: number;

  @OneToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'varchar', length: 100 })
  equipmentType: string; // BOILER, TURBINE, GENERATOR, FURNACE

  @Column({ type: 'int' })
  primaryFuelId: number;

  @ManyToOne(() => MasterFuel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'primaryFuelId' })
  primaryFuel: MasterFuel;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  ratedCapacityMw: number;
}
