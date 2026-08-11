import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Scope3Activity } from './scope3-activity.entity';

@Entity({ name: 'business_travel_details' })
export class BusinessTravelDetail extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  scope3ActivityId: number;

  @OneToOne(() => Scope3Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scope3ActivityId' })
  scope3Activity: Scope3Activity;

  @Column({ type: 'varchar', length: 50 })
  travelMode: string; // AIR, RAIL, HOTEL, CAR_RENTAL, TAXI

  @Column({ type: 'varchar', length: 50, nullable: true })
  cabinClass: string; // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST

  @Column({ type: 'int', default: 1 })
  passengerCount: number;

  @Column({ type: 'boolean', default: true })
  hasRadiativeForcing: boolean;

  @Column({ type: 'int', nullable: true })
  hotelNights: number;

  @Column({ type: 'int', nullable: true })
  hotelRooms: number;
}
