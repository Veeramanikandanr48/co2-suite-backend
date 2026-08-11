import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_energy_types' })
export class MasterEnergyType extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // ELECTRICITY, STEAM, HEATING, COOLING

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', nullable: true })
  defaultUnitId: number;

  @Column({ type: 'text', nullable: true })
  description: string;
}
