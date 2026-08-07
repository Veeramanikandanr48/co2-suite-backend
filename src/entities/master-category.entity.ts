import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterType } from './master-type.entity';

@Entity({ name: 'master_categories' })
export class MasterCategory extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  icon: string;

  @OneToMany(() => MasterType, (type) => type.category)
  types: MasterType[];
}
