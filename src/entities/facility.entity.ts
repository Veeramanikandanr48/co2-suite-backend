import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'facilities' })
export class Facility extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
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
}
