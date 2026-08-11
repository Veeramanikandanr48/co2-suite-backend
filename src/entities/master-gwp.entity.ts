import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_gwp' })
@Unique(['assessmentReport', 'timeHorizon', 'gas', 'origin'])
export class MasterGWP extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'AR6' })
  assessmentReport: string; // 'AR6', 'AR5', 'AR4'

  @Column({ type: 'varchar', length: 50, default: '100Y' })
  timeHorizon: string; // '100Y', '20Y'

  @Column({ type: 'varchar', length: 50 })
  gas: string; // 'CO2', 'CH4', 'N2O', 'HFC', 'PFC', 'SF6', 'NF3'

  @Column({ type: 'varchar', length: 50, default: 'ALL' })
  origin: string; // 'FOSSIL', 'NON_FOSSIL', 'ALL'

  @Column({ type: 'float' })
  gwpValue: number; // e.g. 1 (CO2), 29.8 (fossil CH4 AR6), 27.2 (non-fossil CH4 AR6), 273 (N2O AR6)

  @Column({ type: 'text', nullable: true })
  description: string;
}
