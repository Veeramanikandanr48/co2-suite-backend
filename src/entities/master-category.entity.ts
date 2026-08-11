import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'master_category' })
export class MasterCategory extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  scope: string; // e.g. 'Scope 1', 'Scope 2', 'Scope 3'

  @Column({ type: 'int', nullable: true })
  scopeId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string; // e.g. 'SC'

  /** Scope Type classification (SCOPE_1, SCOPE_2, SCOPE_3) */
  @Column({ type: 'varchar', length: 50, nullable: true, default: 'SCOPE_1' })
  scopeType: string;

  /** GHG Protocol Scope 3 Category Number (1-15) */
  @Column({ type: 'int', nullable: true })
  scope3CategoryNumber: number;

  /** Calculation methodology routing key (FUEL_BASED, DISTANCE_BASED, SPEND_BASED, LOCATION_BASED, MARKET_BASED, MASS_BASED, SUPPLIER_SPECIFIC) */
  @Column({ type: 'varchar', length: 100, nullable: true, default: 'FUEL_BASED' })
  calculationMethod: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
