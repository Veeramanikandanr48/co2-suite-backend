import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterApprovalStatus } from './master.entity';

@Entity({ name: 'approval_modules' })
export class ApprovalModules extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  moduleName: string;

  @Column({ type: 'varchar' })
  moduleShortName: string;

  @Column({ type: 'varchar' })
  mappingTable: string;

  @Column({ type: 'varchar' })
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

  @Column({ type: 'varchar' })
  conditionName: string;

  @Column({ type: 'int' })
  toRoleId: number;

  @Column({ type: 'int' })
  approvalOrder: number;

  @Column({ type: 'int' })
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

  @Column({ type: 'int' })
  approvalModuleUniqueId: number;

  @Column({ type: 'int', nullable: true })
  toRoleId: number;

  @Column({ type: 'int', nullable: true })
  toUserId: number;

  @Column({ type: 'int' })
  approvalOrder: number;

  @Column({ type: 'int' })
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

  @Column({ type: 'int' })
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
