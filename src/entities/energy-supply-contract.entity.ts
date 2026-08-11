import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterGeography } from './master-geography.entity';
import type { EnergyAttributeInstrument } from './energy-attribute-instrument.entity';

@Entity({ name: 'energy_supply_contracts' })
export class EnergySupplyContract extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  supplierName: string;

  @Column({ type: 'varchar', length: 100 })
  contractNumber: string;

  @Column({ type: 'varchar', length: 255 })
  energyProduct: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'int', nullable: true })
  marketRegionId: number;

  @ManyToOne(() => MasterGeography, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'marketRegionId' })
  marketRegion: MasterGeography;

  @OneToMany('EnergyAttributeInstrument', 'contract')
  instruments: EnergyAttributeInstrument[];
}
