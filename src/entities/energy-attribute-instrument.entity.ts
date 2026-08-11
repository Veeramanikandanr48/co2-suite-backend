import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { EnergySupplyContract } from './energy-supply-contract.entity';

@Entity({ name: 'energy_attribute_instruments' })
export class EnergyAttributeInstrument extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  contractId: number;

  @ManyToOne(() => EnergySupplyContract, (c) => c.instruments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contractId' })
  contract: EnergySupplyContract;

  @Column({ type: 'varchar', length: 50 })
  instrumentType: string; // EAC, REC, GO, I_REC

  @Column({ type: 'varchar', length: 100 })
  certificateId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantityMwh: number;

  @Column({ type: 'date', nullable: true })
  generationStart: string;

  @Column({ type: 'date', nullable: true })
  generationEnd: string;
}
