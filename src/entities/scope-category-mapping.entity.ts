import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterScope } from './master-scope.entity';
import { MasterCategory } from './master-category.entity';

@Entity({ name: 'scope_category_mapping' })
export class ScopeCategoryMapping extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  scopeId: number;

  @ManyToOne(() => MasterScope, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scopeId' })
  masterScope: MasterScope;

  @Column({ type: 'int', nullable: true })
  categoryId: number;

  @ManyToOne(() => MasterCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  masterCategory: MasterCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  sortOrder: number;
}
