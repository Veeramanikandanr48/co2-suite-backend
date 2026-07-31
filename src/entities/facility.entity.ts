import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'facilities' })
export class Facility extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
  organizationId: number;

  @Column()
  name: string; // e.g. 'WD Solutions Co. LLC'

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  address: string; // Installation location

  @Column({ nullable: true })
  unLocode: string; // UN/LOCODE

  @Column({ nullable: true })
  postCode: string;

  @Column({ nullable: true })
  countryCode: string;
}
