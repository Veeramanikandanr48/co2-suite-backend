import { PrimaryGeneratedColumn } from 'typeorm';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserDetails } from './user.entity';

export class BaseColumns {
  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => UserDetails, (user) => user.id)
  @JoinColumn({ name: 'createdBy' })
  createdBy: number;

  @ManyToOne(() => UserDetails, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: number;

  @ManyToOne(() => UserDetails, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'deletedBy' })
  deletedBy: number;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;

  @DeleteDateColumn({ nullable: true })
  deletedOn: Date;
}

@Entity({ name: 'master_roles' })
export class MasterRoles extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleName: string;

  @Column({ nullable: true })
  roleShortName: string;
}

@Entity({ name: 'master_approval_status' })
export class MasterApprovalStatus extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // need to change
}

@Entity({ name: 'master_currency' })
export class MasterCurrency extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  currencyName: string;

  @Column()
  currencyCode: string;

  @Column({ nullable: true })
  currencySymbol: string;
}

@Entity({ name: 'master_country' })
export class MasterCountry extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  countryName: string;

  @Column()
  countryCode: string;
}

@Entity({ name: 'master_state' })
export class MasterState extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stateName: string;

  @Column()
  stateCode: string;

  @ManyToOne(() => MasterCountry, (country) => country.id)
  @JoinColumn({ name: 'countryId' })
  countryId: number;
}

@Entity({ name: 'master_gender' })
export class MasterGender extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  genderName: string;

  @Column({ nullable: true })
  genderShortName: string;
}

@Entity({ name: 'master_hobbies' })
export class MasterHobbies extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  hobbyName: string;
}
