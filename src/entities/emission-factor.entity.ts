import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'emission_factors' })
export class EmissionFactor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category: string; // e.g. 'Stationary Combustion', 'Mobile Combustion', 'Fugitive Emissions', 'Process Emissions'

  @Column()
  source: string; // e.g. 'IPCC (Commercial & Institutional Use)-AR6', 'IPCC-AR6', 'Defra 2024'

  @Column({ default: 'AR6' })
  version: string;

  @Column()
  fuelOrGasType: string; // e.g. 'Natural Gas', 'Diesel - On Road', 'HFC-134a'

  @Column({ default: 'sm3' })
  unit: string;

  @Column({ type: 'float', default: 1.0 })
  factor: number;

  @Column({ default: '(amount * factor) / 1000' })
  formula: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;
}
