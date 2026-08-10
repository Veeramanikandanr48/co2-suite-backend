import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterFactorVersion } from './master-factor-version.entity';
import type { CategoryDatasourceMapping } from './category-datasource-mapping.entity';

@Entity({ name: 'master_datasource' })
export class MasterDatasource extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Department for Energy Security and Net Zero'

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string; // e.g. 'DEFRA', 'IPCC', 'EPA', 'GHG-PROTOCOL'

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string; // e.g. 'https://www.gov.uk/government/publications/...'

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('MasterFactorVersion', 'datasource')
  versions: MasterFactorVersion[];

  @OneToMany('CategoryDatasourceMapping', 'masterDatasource')
  categoryMappings: CategoryDatasourceMapping[];
}
