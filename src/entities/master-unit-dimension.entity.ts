import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterUnit } from './master-unit.entity';

@Entity({ name: 'master_unit_dimensions' })
export class MasterUnitDimension extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // MASS, VOLUME, ENERGY, DISTANCE, AREA, TIME, CURRENCY, PASSENGER_DISTANCE, TONNE_DISTANCE, COUNT

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany('MasterUnit', 'dimension')
  units: MasterUnit[];
}
