import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFuel } from './master-fuel.entity';

@Entity({ name: 'master_scope' })
export class MasterScope extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Stationary Combustion', 'Mobile Combustion', 'Fugitive Emissions'

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  code: string; // e.g. 'SC', 'MC', 'FE', 'PE'

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('MasterFuel', 'scope')
  fuels: MasterFuel[];
}
