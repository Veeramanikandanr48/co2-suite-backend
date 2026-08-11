import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterCategory } from './master-category.entity';

@Entity({ name: 'master_activity_type' })
@Unique(['code'])
export class MasterActivityType extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number;

  @ManyToOne(() => MasterCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  masterCategory: MasterCategory;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Goods - Mass Based', 'Air Travel', 'WTT Fuel Upstream', 'Employee Commuting Survey'

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string; // e.g. 'CAT1_GOODS_MASS', 'CAT1_GOODS_SPEND', 'CAT3_WTT', 'CAT3_TD', 'CAT4_FREIGHT', 'CAT6_AIR', 'CAT7_COMMUTING'

  @Column({ type: 'varchar', length: 100, default: 'FUEL_BASED' })
  calculationMethod: string; // e.g. 'FUEL_BASED', 'DISTANCE_BASED', 'SPEND_BASED', 'EMPLOYEE_COMMUTING_BASED', 'LOCATION_BASED', 'MARKET_BASED', 'MASS_BASED'

  @Column({ type: 'text', nullable: true })
  description: string;
}
