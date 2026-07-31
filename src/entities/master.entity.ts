import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_roles' })
export class MasterRoles extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  roleName: string;

  @Column({ nullable: true })
  roleShortName: string;
}

@Entity({ name: 'master_approval_status' })
export class MasterApprovalStatus extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string; // need to change
}
