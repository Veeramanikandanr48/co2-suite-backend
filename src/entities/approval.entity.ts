import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MasterApprovalStatus } from './master.entity';
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

@Entity({ name: 'approval_modules' })
export class ApprovalModules extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  moduleName: string;

  @Column()
  moduleShortName: string;

  @Column()
  mappingTable: string;

  @Column()
  mappingColumn: string;
}

@Entity({ name: 'approval_matrix' })
@Index(['approvalModuleId', 'conditionName', 'toRoleId'], { unique: true })
export class ApprovalMatrix extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ApprovalModules, (module) => module.id)
  @JoinColumn({ name: 'approvalModuleId' })
  approvalModuleId: number;

  @Column()
  conditionName: string;

  @Column()
  toRoleId: number;

  @Column()
  approvalOrder: number;

  @Column()
  approvalGroup: number;

  @Column({ default: false })
  isParallel: boolean;
}

@Entity({ name: 'user_approval' })
@Index(['approvalModuleUniqueId'])
export class UserApproval extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ApprovalModules, (module) => module.id)
  @JoinColumn({ name: 'approvalModuleId' })
  approvalModuleId: number;

  @Column()
  approvalModuleUniqueId: number;

  @Column({ nullable: true })
  toRoleId: number;

  @Column({ nullable: true })
  toUserId: number;

  @Column()
  approvalOrder: number;

  @Column()
  approvalGroup: number;

  @ManyToOne(() => MasterApprovalStatus, (status) => status.id, {
    nullable: true,
  })
  @JoinColumn({ name: 'approvalStatusId' })
  approvalStatusId: number;

  @Column({ default: false })
  isParallel: boolean;

  @Column({ default: false })
  isCurrApprover: boolean;

  @Column({ default: false })
  isNextApprover: boolean;

  @Column()
  userRoleId: number;
}

@Entity({ name: 'user_approval_remarks_mapping' })
export class UserApprovalRemarksMapping extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  remarks: string;

  @ManyToOne(() => UserApproval, (userApproval) => userApproval.id)
  @JoinColumn({ name: 'userApprovalId' })
  userApprovalId: number;

  @ManyToOne(() => MasterApprovalStatus, (status) => status.id)
  @JoinColumn({ name: 'approvalStatusId' })
  approvalStatusId: number;
}
