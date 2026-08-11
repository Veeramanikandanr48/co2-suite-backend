import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFuel } from './master-fuel.entity';
import type { MasterUnit } from './master-unit.entity';

@Entity({ name: 'fuel_unit_mapping' })
@Unique(['fuelId', 'unitId'])
export class FuelUnitMapping extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  fuelId: number;

  @ManyToOne('MasterFuel', 'unitMappings', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fuelId' })
  masterFuel: MasterFuel;

  @Column({ type: 'int', nullable: true })
  unitId: number;

  @ManyToOne('MasterUnit', 'fuelMappings', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  masterUnit: MasterUnit;

  @Column({ type: 'float', nullable: true })
  emissionFactor: number;

  @Column({ type: 'text', nullable: true })
  description: string;
}
