import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'service_scope_items' })
@Index(['serviceCode', 'isActive'])
@Index(['scopeCode'])
export class ServiceScopeItem extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  serviceCode: string;

  @Column({ type: 'varchar' })
  scope: string; // e.g. 'Scope 1', 'Scope 2', 'Scope 3'

  @Column({ type: 'varchar' })
  scopeCode: string; // e.g. 'SCOPE_1', 'SCOPE_2', 'SCOPE_3'

  @Column({ type: 'varchar' })
  name: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'varchar' })
  code: string; // e.g. 'STATIONARY_COMBUSTION'

  @Column({ type: 'varchar', nullable: true })
  description: string;

  /**
   * Default unit for activities in this scope item (e.g. 'kWh', 'litre', 'tonne').
   * Required by SummaryService for unit-aware aggregation.
   */
  @Column({ type: 'varchar', nullable: true })
  unit: string;

  /**
   * GHG category label used for grouping in reports (e.g. 'Stationary Combustion').
   * Matches InventoryEntry.category for cross-referencing.
   */
  @Column({ type: 'varchar', nullable: true })
  category: string;

  @Column({ default: 0 })
  sortOrder: number;
}
