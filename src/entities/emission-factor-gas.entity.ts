import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { MasterItem } from './master-item.entity';
import { EmissionFactor } from './emission-factor.entity';

/**
 * Normalized greenhouse gas breakdown per emission factor.
 * Stores one row per gas per factor, keyed by gasId (MasterItem) and
 * optionally by gwpVersionId — allowing CH₄ AR4=25 / AR5=28 / AR6=27.2
 * to coexist without any schema changes.
 */
@Entity({ name: 'emission_factor_gases' })
@Index(['emissionFactorId', 'gasId', 'gwpVersionId'], { unique: true })
export class EmissionFactorGas extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emissionFactorId: number;

  @ManyToOne(() => EmissionFactor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emissionFactorId' })
  emissionFactor: EmissionFactor;

  @Column()
  gasId: number;

  @ManyToOne(() => MasterItem, { eager: true })
  @JoinColumn({ name: 'gasId' })
  gasTypeItem: MasterItem;

  /**
   * Optional GWP version that applies to this gas value.
   * AR4 / AR5 / AR6 / AR7 produce different CO₂e multipliers for the same gas.
   * Null = global / unspecified GWP version.
   */
  @Column({ nullable: true })
  gwpVersionId: number;

  @ManyToOne(() => MasterItem, { nullable: true, eager: true })
  @JoinColumn({ name: 'gwpVersionId' })
  gwpVersionItem: MasterItem;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  value: number;
}
