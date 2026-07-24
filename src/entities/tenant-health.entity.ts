import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity({ name: 'tenant_health', schema: 'public' })
export class TenantHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  organizationId: string;

  @Column({ type: 'integer', default: 1 })
  schemaVersion: number;

  @Column({ type: 'varchar', length: 50, default: 'HEALTHY' })
  migrationStatus: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  storageUsedMB: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastBackupAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActivityAt?: Date;

  @OneToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
