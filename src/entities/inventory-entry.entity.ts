import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'inventory_entries' })
export class InventoryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  organizationId: number;

  @Column({ default: 'CARBON' })
  serviceCode: string;

  @Column()
  category: string; // e.g. 'Stationary Combustion'

  @Column()
  name: string; // e.g. 'Natural Gas'

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'float', default: 0 })
  ef: number;

  @Column({ nullable: true })
  efSource: string;

  @Column({ nullable: true })
  dateFrom: string;

  @Column({ nullable: true })
  dateTo: string;

  @Column({ nullable: true })
  facility: string;

  @Column({ type: 'float', default: 0 })
  emission: number;

  @Column({ default: 'completed' })
  status: string; // 'completed', 'pending', 'draft'

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  approvalStatus: string;

  @Column({ nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;
}
