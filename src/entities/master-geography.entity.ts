import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_geographies' })
export class MasterGeography extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  parentId: number;

  @ManyToOne(() => MasterGeography, (geo) => geo.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: MasterGeography;

  @OneToMany(() => MasterGeography, (geo) => geo.parent)
  children: MasterGeography[];

  @Column({ type: 'varchar', length: 50 })
  geographyType: string; // GLOBAL, CONTINENT, COUNTRY, REGION, GRID_SUBREGION, UTILITY

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  iso2: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  iso3: string;
}
