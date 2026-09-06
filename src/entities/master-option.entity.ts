import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

export enum MasterOptionType {
  SCOPE = 'SCOPE',
  CATEGORY = 'CATEGORY',
  FUEL = 'FUEL',
  UNIT = 'UNIT',
  DATASOURCE = 'DATASOURCE',
  FACTOR_VERSION = 'FACTOR_VERSION',
  FORMULA = 'FORMULA',
}

@Entity({ name: 'master_options' })
export class MasterOption extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  type: string; // MasterOptionType string e.g. 'FUEL', 'UNIT', 'DATASOURCE'

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Natural Gas', 'kWh', 'DEFRA 2024'

  @Column({ type: 'varchar', length: 100, nullable: true })
  code: string; // e.g. 'NG', 'kWh', 'DEFRA'

  @Column({ type: 'int', nullable: true })
  parentId: number; // e.g. datasourceId for version, or scopeId for category

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any; // Flexible JSON properties e.g. { unitIds: [1, 2], scopeId: 1, year: 2024, factor: 1.5 }
}
