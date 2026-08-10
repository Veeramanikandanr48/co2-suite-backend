import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { MasterUnit } from './master-unit.entity';
import type { MasterFormula } from './master-formula.entity';

@Entity({ name: 'unit_formula_mapping' })
export class UnitFormulaMapping extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  unitId: number;

  @ManyToOne('MasterUnit', 'formulaMappings', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  masterUnit: MasterUnit;

  @Column({ type: 'int', nullable: true })
  formulaId: number;

  @ManyToOne('MasterFormula', 'unitMappings', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formulaId' })
  masterFormula: MasterFormula;

  @Column({ type: 'text', nullable: true })
  description: string;
}
