import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_formula' })
export class MasterFormula extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Standard Factor Conversion', 'Direct Emission'

  @Column({ type: 'text' })
  formula: string; // e.g. '(amount * factor) / 1000', 'amount * factor'

  @Column({ type: 'simple-json', nullable: true })
  variables: string[]; // e.g. ['amount', 'factor']

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  outputUnit: string; // e.g. 'tCO2e', 'kgCO2e'
}
