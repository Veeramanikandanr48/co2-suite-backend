import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MasterModule } from './master.entity';

/**
 * Permissions table — source of truth for all CASL rules.
 *
 * Uses moduleId (FK → master_modules) for referential integrity.
 * Features an immutable `permissionKey` (e.g. 'users:profile:read:any')
 * for fast indexing, canonical identification, and clean audit logs.
 */
@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Canonical immutable permission key.
   * Format: `<moduleKey>:<resource>:<action>:<scope>` (e.g. 'users:profile:read:any')
   */
  @Column({ nullable: true, unique: true })
  permissionKey: string;

  /**
   * FK → master_modules.id
   */
  @Column()
  moduleId: number;

  @ManyToOne(() => MasterModule)
  @JoinColumn({ name: 'moduleId' })
  module: MasterModule;

  /** e.g. 'profile', 'invoice', 'certificate' */
  @Column()
  resource: string;

  /** e.g. 'read', 'create', 'update', 'delete', 'download' */
  @Column()
  action: string;

  /** 'own' | 'any' — enables ownership-based CASL rules */
  @Column({ default: 'any' })
  scope: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;

  @DeleteDateColumn({ nullable: true })
  deletedOn: Date;
}
