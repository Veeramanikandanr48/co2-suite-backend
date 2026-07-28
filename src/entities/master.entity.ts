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
