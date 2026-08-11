import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_gases' })
@Unique(['chemicalFormula'])
export class MasterGas extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  chemicalFormula: string; // CO2, CH4, N2O, SF6, NF3, HFC-32, HFC-125, HFC-134a, etc.

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isKyotoGhg: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  casNumber: string;
}
