import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import { FormulaRevision } from './formula-revision.entity';

@Entity({ name: 'formulas' })
export class Formula extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => FormulaRevision, (rev) => rev.formula, { cascade: true })
  revisions: FormulaRevision[];
}
