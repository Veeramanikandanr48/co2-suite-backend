import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export type ReportingPeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

@Entity({ name: 'reporting_periods' })
@Unique(['organizationId', 'year'])
export class ReportingPeriod extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', nullable: false })
  organizationId: number;

  @Column({ type: 'int', nullable: false })
  year: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  @Column({ type: 'date', nullable: false })
  startDate: string;

  @Column({ type: 'date', nullable: false })
  endDate: string;

  @Column({ type: 'varchar', length: 50, default: 'OPEN' })
  status: ReportingPeriodStatus;

  @Column({ type: 'int', nullable: true })
  lockedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;

  @Column({ type: 'text', nullable: true })
  lockReason: string;
}
