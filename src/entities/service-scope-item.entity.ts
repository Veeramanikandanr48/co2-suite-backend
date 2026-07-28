import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'service_scope_items' })
export class ServiceScopeItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serviceCode: string;

  @Column()
  scope: string; // e.g. 'Scope 1', 'Scope 2', 'Scope 3'

  @Column()
  scopeCode: string; // e.g. 'SCOPE_1', 'SCOPE_2', 'SCOPE_3'

  @Column()
  name: string; // e.g. 'Stationary Combustion'

  @Column()
  code: string; // e.g. 'STATIONARY_COMBUSTION'

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;
}
