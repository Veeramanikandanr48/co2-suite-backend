import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export enum ImportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'import_jobs' })
@Index(['status'])
export class ImportJob extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  fileName: string;

  @Column({ type: 'int', default: 0 })
  totalRows: number;

  @Column({ type: 'int', default: 0 })
  processedRows: number;

  @Column({ type: 'int', default: 0 })
  successRows: number;

  @Column({ type: 'int', default: 0 })
  errorRows: number;

  @Column({ type: 'varchar', length: 50, default: ImportJobStatus.PENDING })
  status: ImportJobStatus;

  @Column({ type: 'boolean', default: false })
  isDryRun: boolean;

  @OneToMany(() => ImportJobError, (err) => err.importJob, { cascade: true })
  errors: ImportJobError[];
}

@Entity({ name: 'import_job_errors' })
export class ImportJobError extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  importJobId: number;

  @ManyToOne(() => ImportJob, (job) => job.errors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'importJobId' })
  importJob: ImportJob;

  @Column({ type: 'int' })
  rowIndex: number;

  @Column({ type: 'varchar' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  rowData: Record<string, any>;
}
