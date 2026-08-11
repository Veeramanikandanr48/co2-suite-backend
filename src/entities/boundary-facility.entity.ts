import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { OrganizationalBoundary } from './organizational-boundary.entity';
import { Facility } from './facility.entity';

@Entity({ name: 'boundary_facilities' })
export class BoundaryFacility extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  boundaryId: number;

  @ManyToOne(() => OrganizationalBoundary, (b) => b.boundaryFacilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'boundaryId' })
  boundary: OrganizationalBoundary;

  @Column({ type: 'int' })
  facilityId: number;

  @ManyToOne(() => Facility, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ type: 'varchar', length: 50, default: 'INCLUDED' })
  inclusionStatus: string; // INCLUDED, EXCLUDED

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  ownershipPercentage: number;

  @Column({ type: 'varchar', length: 50, default: 'OPERATIONAL_CONTROL' })
  controlStatus: string;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true })
  effectiveTo: string;
}
