import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterDatasource } from './master-datasource.entity';
import type { EmissionFactor } from './emission-factor.entity';

@Entity({ name: 'factor_dataset_versions' })
@Unique(['datasourceId', 'datasetCode', 'version'])
export class FactorDatasetVersion extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  datasourceId: number;

  @ManyToOne(() => MasterDatasource, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'datasourceId' })
  datasource: MasterDatasource;

  @Column({ type: 'varchar', length: 100 })
  datasetCode: string; // DEFRA_2025, EPA_2024, IEA_2024, ECOINVENT_3_10

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ type: 'date' })
  publicationDate: string;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true })
  effectiveTo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  methodologyVersion: string;

  @Column({ type: 'boolean', default: true })
  isImmutable: boolean;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @OneToMany('EmissionFactor', 'datasetVersion')
  factors: EmissionFactor[];
}
