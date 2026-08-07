import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterType } from './master-type.entity';

@Entity({ name: 'service_domains' })
export class ServiceDomain extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  icon: string;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  color: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => MasterType, (masterType) => masterType.serviceDomains)
  masterTypes: MasterType[];
}
