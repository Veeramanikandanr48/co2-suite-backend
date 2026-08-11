import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { Facility } from './facility.entity';

@Entity({ name: 'assets' })
@Unique(['facilityId', 'assetCode'])
export class Asset extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  facilityId: number;

  @ManyToOne(() => Facility, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ type: 'varchar', length: 100 })
  assetCode: string;

  @Column({ type: 'varchar', length: 255 })
  assetName: string;

  @Column({ type: 'varchar', length: 50 })
  assetType: string; // VEHICLE, COMBUSTION_EQUIPMENT, PROCESS_SOURCE, REFRIGERATION_EQUIPMENT

  @Column({ type: 'varchar', length: 50, default: 'OWNED' })
  ownershipType: string; // OWNED, FINANCE_LEASE, OPERATING_LEASE, EMPLOYEE_OWNED, THIRD_PARTY

  @Column({ type: 'boolean', default: true })
  operationalControl: boolean;

  @Column({ type: 'date', nullable: true })
  validFrom: string;

  @Column({ type: 'date', nullable: true })
  validTo: string;
}
