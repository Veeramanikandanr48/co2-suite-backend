import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterScope } from './master-scope.entity';

@Entity({ name: 'master_fuel' })
export class MasterFuel extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Natural Gas', 'Diesel - On Road', 'HFC-134a'

  @Column({ type: 'varchar', length: 100, nullable: true })
  code: string; // e.g. 'NAT_GAS', 'DIESEL_ROAD'

  @Column({ type: 'int', nullable: true })
  scopeId: number;

  @ManyToOne('MasterScope', 'fuels', { nullable: true })
  @JoinColumn({ name: 'scopeId' })
  scope: MasterScope;

  @Column({ type: 'text', nullable: true })
  description: string;
}
