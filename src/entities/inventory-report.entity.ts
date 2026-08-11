import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { OrganizationalBoundary } from './organizational-boundary.entity';
import type { ReportLine } from './report-line.entity';

@Entity({ name: 'inventory_reports' })
export class InventoryReport extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'int' })
  reportingPeriodId: number;

  @Column({ type: 'int', nullable: true })
  boundaryId: number;

  @ManyToOne(() => OrganizationalBoundary, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'boundaryId' })
  boundary: OrganizationalBoundary;

  @Column({ type: 'varchar', length: 255 })
  reportTitle: string;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: string; // DRAFT, SUBMITTED, VERIFIED, PUBLISHED

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @OneToMany('ReportLine', 'report')
  lines: ReportLine[];
}
