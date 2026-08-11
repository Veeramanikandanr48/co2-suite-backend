import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { CalculationRun } from './calculation-run.entity';

@Entity({ name: 'calculation_input_snapshots' })
export class CalculationInputSnapshot extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  calculationRunId: number;

  @ManyToOne(() => CalculationRun, (r) => r.inputSnapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'calculationRunId' })
  calculationRun: CalculationRun;

  @Column({ type: 'varchar', length: 100 })
  inputDefinitionCode: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  rawValue: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rawUnit: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  normalizedValue: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  normalizedUnit: string;
}
