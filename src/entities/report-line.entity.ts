import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryReport } from './inventory-report.entity';
import { CalculationResult } from './calculation-result.entity';

@Entity({ name: 'report_lines' })
export class ReportLine extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  reportId: number;

  @ManyToOne(() => InventoryReport, (r) => r.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: InventoryReport;

  @Column({ type: 'int' })
  calculationResultId: number;

  @ManyToOne(() => CalculationResult, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'calculationResultId' })
  calculationResult: CalculationResult;

  @Column({ type: 'varchar', length: 50 })
  scopeCode: string; // SCOPE_1, SCOPE_2, SCOPE_3

  @Column({ type: 'varchar', length: 100 })
  categoryCode: string;

  @Column({ type: 'int' })
  facilityId: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  reportedCo2eTonnes: number;
}
