import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterItem } from './master-item.entity';

@Entity({ name: 'fuel_type_measurement_units' })
@Index(['fuelGasTypeId', 'measurementUnitId'], { unique: true })
export class FuelTypeMeasurementUnit extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fuelGasTypeId: number;

  @ManyToOne(() => MasterItem, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'fuelGasTypeId' })
  fuelGasType: MasterItem;

  @Column()
  measurementUnitId: number;

  @ManyToOne(() => MasterItem, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'measurementUnitId' })
  measurementUnit: MasterItem;
}
