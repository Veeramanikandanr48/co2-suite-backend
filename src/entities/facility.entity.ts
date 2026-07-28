import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'facilities' })
export class Facility {
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

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;
}
