import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { CalculationRun } from './calculation-run.entity';
import { MasterGas } from './master-gas.entity';

@Entity({ name: 'calculation_gas_results' })
@Unique(['calculationRunId', 'gasId', 'carbonOrigin'])
export class CalculationGasResult extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  calculationRunId: number;

  @ManyToOne(() => CalculationRun, (r) => r.gasResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calculationRunId' })
  calculationRun: CalculationRun;

  @Column({ type: 'int' })
  gasId: number;

  @ManyToOne(() => MasterGas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'gasId' })
  gas: MasterGas;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  gasMassKg: number;

  @Column({ type: 'varchar', length: 50 })
  gwpAssessmentCode: string; // AR6, AR5, AR4

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  gwpValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  co2eTonnes: number;

  @Column({ type: 'varchar', length: 50, default: 'FOSSIL' })
  carbonOrigin: string; // FOSSIL, BIOGENIC
}
