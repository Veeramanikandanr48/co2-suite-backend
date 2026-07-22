import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserDetails } from './user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** e.g. 'role', 'permission', 'user_role', 'role_permission' */
  @Column()
  entityType: string;

  /** Primary key of the entity that was modified */
  @Column()
  entityId: number;

  /** 'created' | 'updated' | 'deleted' | 'assigned' | 'revoked' */
  @Column()
  action: string;

  @Column()
  changedBy: number;

  @ManyToOne(() => UserDetails)
  @JoinColumn({ name: 'changedBy' })
  changedByUser: UserDetails;

  /** JSON snapshot of the record before the change */
  @Column({ type: 'text', nullable: true })
  oldValue: string;

  /** JSON snapshot of the record after the change */
  @Column({ type: 'text', nullable: true })
  newValue: string;

  @CreateDateColumn()
  createdOn: Date;
}
