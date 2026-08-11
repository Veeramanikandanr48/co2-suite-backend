import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_calculation_methods' })
export class MasterCalculationMethod extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string; // FUEL_BASED, DISTANCE_BASED, SPEND_BASED, LOCATION_BASED, MARKET_BASED, MASS_BALANCE, REFRIGERANT_RECHARGE, etc.

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  formulaType: string;

  @Column({ type: 'varchar', length: 100 })
  engineHandler: string;
}
