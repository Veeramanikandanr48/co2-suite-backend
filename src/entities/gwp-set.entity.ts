import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { GwpValue } from './gwp-value.entity';

@Entity({ name: 'gwp_set' })
export class GwpSet extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assessment: string; // AR4 | AR5 | AR6

  @Column({ type: 'int', default: 100 })
  timeHorizon: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  version: string;

  @Column({ type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ type: 'boolean', default: true })
  isFossilMethaneDistinguished: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('GwpValue', 'gwpSet')
  values: GwpValue[];
}