import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Scope3Activity } from './scope3-activity.entity';

@Entity({ name: 'transport_details' })
export class TransportDetail extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  scope3ActivityId: number;

  @OneToOne(() => Scope3Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scope3ActivityId' })
  scope3Activity: Scope3Activity;

  @Column({ type: 'varchar', length: 50, default: 'UPSTREAM' })
  transportDirection: string; // UPSTREAM (Cat 4), DOWNSTREAM (Cat 9)

  @Column({ type: 'varchar', length: 50 })
  vehicleMode: string; // ROAD_RIGID, ROAD_ARTICULATED, RAIL_FREIGHT, SEA_CONTAINER, AIR_FREIGHT

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  cargoWeightTonnes: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  distanceKm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  loadFactorPct: number;
}
