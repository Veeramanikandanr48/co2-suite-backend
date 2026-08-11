import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { CalculationRun } from './calculation-run.entity';

@Entity({ name: 'calculation_results' })
export class CalculationResult extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  calculationRunId: number;

  @OneToOne(() => CalculationRun, (r) => r.result, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calculationRunId' })
  calculationRun: CalculationRun;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  totalCo2eTonnes: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  fossilCo2eTonnes: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  biogenicCo2Tonnes: number;

  @Column({ type: 'text', nullable: true })
  formulaDisplay: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  normalizedQuantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  normalizedUnit: string;
}
