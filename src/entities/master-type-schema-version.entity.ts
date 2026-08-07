import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterType } from './master-type.entity';

@Entity({ name: 'master_type_schema_versions' })
export class MasterTypeSchemaVersion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  masterTypeId: number;

  @ManyToOne(() => MasterType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'masterTypeId' })
  masterType: MasterType;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', default: 'PUBLISHED', length: 30 })
  status: string; // DRAFT | PUBLISHED | ARCHIVED

  @Column({ type: 'varchar', nullable: true, length: 64 })
  checksum: string;

  // Cohesive Immutable Schema Document
  @Column({ type: 'jsonb', nullable: true })
  schema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  formSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  validationSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  gridSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  detailSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  workflowSchema: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  publishedBy: string;
}
