import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { InventoryActivity } from './inventory-activity.entity';
import { MasterCalculationMethod } from './master-calculation-method.entity';
import type { CalculationInputSnapshot } from './calculation-input-snapshot.entity';
import type { CalculationFactorSnapshot } from './calculation-factor-snapshot.entity';
import type { CalculationGasResult } from './calculation-gas-result.entity';
import type { CalculationResult } from './calculation-result.entity';

@Entity({ name: 'calculation_runs' })
export class CalculationRun extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activityId: number;

  @ManyToOne(() => InventoryActivity, (a) => a.calculationRuns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activityId' })
  activity: InventoryActivity;

  @Column({ type: 'int' })
  calculationMethodId: number;

  @ManyToOne(() => MasterCalculationMethod, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'calculationMethodId' })
  calculationMethod: MasterCalculationMethod;

  @Column({ type: 'varchar', length: 50, default: '2.0.0' })
  engineVersion: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string; // ACTIVE, SUPERSEDED, FAILED

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  executedAt: Date;

  @Column({ type: 'int', nullable: true })
  executedBy: number;

  @Column({ type: 'text', nullable: true })
  errorLog: string;

  @OneToMany('CalculationInputSnapshot', 'calculationRun')
  inputSnapshots: CalculationInputSnapshot[];

  @OneToMany('CalculationFactorSnapshot', 'calculationRun')
  factorSnapshots: CalculationFactorSnapshot[];

  @OneToMany('CalculationGasResult', 'calculationRun')
  gasResults: CalculationGasResult[];

  @OneToOne('CalculationResult', 'calculationRun')
  result: CalculationResult;
}
