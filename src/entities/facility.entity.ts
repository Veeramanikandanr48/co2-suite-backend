import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export type FacilityType = 'Site' | 'Facility' | 'Building' | 'Plant';

@Entity({ name: 'facilities' })
@Index(['organizationId', 'isActive'])
@Index(['parentFacilityId'])
export class Facility extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
  @Index()
  organizationId: number;

  @Column({ type: 'varchar' })
  name: string; // e.g. 'WD Solutions Co. LLC'

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'varchar', nullable: true })
  address: string; // Installation location

  @Column({ type: 'varchar', nullable: true })
  unLocode: string; // UN/LOCODE

  @Column({ type: 'varchar', nullable: true })
  postCode: string;

  @Column({ type: 'varchar', nullable: true })
  countryCode: string;

  /**
   * Self-referencing FK for facility hierarchy.
   * Null = top-level Site; non-null = Facility / Building within a Site.
   * Supports: Site → Facility → Building structure.
   */
  @Column({ type: 'int', nullable: true })
  parentFacilityId: number;

  @ManyToOne(() => Facility, { nullable: true })
  @JoinColumn({ name: 'parentFacilityId' })
  parentFacility: Facility;

  /**
   * Classification of this node in the facility hierarchy.
   * Defaults to 'Facility' for standard installations.
   */
  @Column({
    type: 'varchar',
    default: 'Facility',
    nullable: true,
  })
  type: FacilityType;
}
