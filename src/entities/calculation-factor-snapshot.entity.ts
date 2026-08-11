import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { CalculationRun } from './calculation-run.entity';

@Entity({ name: 'calculation_factor_snapshots' })
export class CalculationFactorSnapshot extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  calculationRunId: number;

  @ManyToOne(() => CalculationRun, (r) => r.factorSnapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'calculationRunId' })
  calculationRun: CalculationRun;

  @Column({ type: 'int', nullable: true })
  factorId: number;

  @Column({ type: 'varchar', length: 100 })
  datasetCode: string;

  @Column({ type: 'varchar', length: 50 })
  datasetVersion: string;

  @Column({ type: 'decimal', precision: 18, scale: 10 })
  factorValue: number;

  @Column({ type: 'varchar', length: 50 })
  factorUnit: string;

  @Column({ type: 'varchar', length: 50 })
  factorBasis: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  geographyCode: string;
}
