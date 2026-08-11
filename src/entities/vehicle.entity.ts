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

@Entity({ name: 'vehicles' })
export class Vehicle extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  assetId: number;

  @OneToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'varchar', length: 100 })
  vehicleType: string;

  @Column({ type: 'int' })
  fuelId: number;

  @ManyToOne(() => MasterFuel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fuelId' })
  fuel: MasterFuel;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registrationNumber: string;

  @Column({ type: 'int', nullable: true })
  modelYear: number;
}
