import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';

@Entity({ name: 'inventory_entries' })
export class InventoryEntry extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ default: 'CARBON' })
  serviceCode: string;

  @Column({ type: 'varchar' })
  category: string; // e.g. 'Stationary Combustion'

  @Column({ type: 'varchar' })
  name: string; // e.g. 'Natural Gas'

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string;

  @Column({ type: 'float', default: 0 })
  ef: number;

  @Column({ type: 'varchar', nullable: true })
  efSource: string;

  @Column({ type: 'varchar', nullable: true })
  dateFrom: string;

  @Column({ type: 'varchar', nullable: true })
  dateTo: string;

  @Column({ type: 'varchar', nullable: true })
  facility: string;

  @Column({ type: 'float', default: 0 })
  emission: number;

  @Column({ default: 'completed' })
  status: string; // 'completed', 'pending', 'draft'

  @Column({ type: 'varchar', nullable: true })
  comment: string;

  @Column({ type: 'varchar', nullable: true })
  approvalStatus: string;

  @Column({ type: 'varchar', nullable: true })
  documentPath: string;
}
