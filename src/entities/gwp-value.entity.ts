import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { GwpSet } from './gwp-set.entity';

@Unique('uq_gwp_set_gas_origin', ['gwpSetId', 'gasCode', 'methaneOrigin'])
@Index('idx_gwp_value_set', ['gwpSetId'])
@Entity({ name: 'gwp_value' })
export class GwpValue extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  gwpSetId: number;

  @ManyToOne('GwpSet', 'values', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gwpSetId' })
  gwpSet: GwpSet;

  @Column({ type: 'varchar', length: 50 })
  gasCode: string; // CO2 | CH4 | N2O | HFC | PFC | SF6 | NF3

  @Column({ type: 'varchar', length: 255, nullable: true })
  gasName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  chemicalFormula: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  methaneOrigin: string; // FOSSIL | NON_FOSSIL | null

  @Column({ type: 'text', nullable: true })
  description: string;
}