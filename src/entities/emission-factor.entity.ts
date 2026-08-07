import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'emission_factors' })
export class EmissionFactor extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  category: string; // e.g. 'Stationary Combustion', 'Mobile Combustion', 'Fugitive Emissions', 'Process Emissions'

  @Column({ type: 'varchar', nullable: true })
  source: string; // e.g. 'IPCC (Commercial & Institutional Use)-AR6', 'IPCC-AR6', 'Defra 2024'

  @Column({ default: 'AR6', nullable: true })
  version: string;

  @Column({ type: 'varchar', nullable: true })
  fuelOrGasType: string; // e.g. 'Natural Gas', 'Diesel - On Road', 'HFC-134a'

  @Column({ default: 'sm3', nullable: true })
  unit: string;

  @Column({ type: 'float', default: 1.0, nullable: true })
  factor: number;

  @Column({ default: '(amount * factor) / 1000', nullable: true })
  formula: string;
}
