import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterDatasource } from './master-datasource.entity';
import type { VersionFuelMapping } from './version-fuel-mapping.entity';
import type { EmissionFactor } from './emission-factor.entity';

@Entity({ name: 'master_factor_version' })
export class MasterFactorVersion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  version: string; // e.g. '2024', 'AR6', 'AR5', '2023'

  @Column({ type: 'int', nullable: true })
  year: number; // e.g. 2024, 2023, 2021

  @Column({ type: 'int', nullable: true })
  datasourceId: number;

  @ManyToOne('MasterDatasource', 'versions', { nullable: true })
  @JoinColumn({ name: 'datasourceId' })
  datasource: MasterDatasource;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('VersionFuelMapping', 'masterFactorVersion')
  fuelMappings: VersionFuelMapping[];

  @OneToMany('EmissionFactor', 'factorVersion')
  emissionFactors: EmissionFactor[];
}
