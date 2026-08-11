import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterCategory } from './master-category.entity';
import { MasterDatasource } from './master-datasource.entity';

@Entity({ name: 'category_datasource_mapping' })
export class CategoryDatasourceMapping extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number;

  @ManyToOne(() => MasterCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  masterCategory: MasterCategory;

  @Column({ type: 'int', nullable: true })
  datasourceId: number;

  @ManyToOne(() => MasterDatasource, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'datasourceId' })
  masterDatasource: MasterDatasource;

  @Column({ type: 'text', nullable: true })
  description: string;
}
