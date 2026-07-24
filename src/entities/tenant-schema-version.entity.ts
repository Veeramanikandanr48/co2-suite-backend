import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'tenant_schema_versions', schema: 'public' })
export class TenantSchemaVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenantCode: string;

  @Column({ type: 'varchar', length: 100 })
  schemaName: string;

  @Column({ type: 'integer' })
  version: number;

  @Column({ type: 'varchar', length: 150 })
  migrationName: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  executedAt: Date;
}
