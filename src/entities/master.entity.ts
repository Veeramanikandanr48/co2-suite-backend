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

  /**
   * Human-readable description of what this role can do.
   * Used for display in Admin Panel role management UI.
   */
  @Column({ type: 'varchar', nullable: true })
  description: string;
}

@Entity({ name: 'master_approval_status' })
export class MasterApprovalStatus extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;
}
