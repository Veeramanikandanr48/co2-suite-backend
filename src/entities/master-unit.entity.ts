import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_unit' })
export class MasterUnit extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g. 'Kilogram CO2 Equivalent', 'Standard Cubic Metre'

  @Column({ type: 'varchar', length: 50, unique: true })
  symbol: string; // e.g. 'kgCO2e', 'sm3', 'L', 'MWh', 'tCO2e'

  @Column({ type: 'text', nullable: true })
  description: string;
}
