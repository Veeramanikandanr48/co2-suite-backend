import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseColumns } from './base-columns.entity';
import type { RefrigerantComponent } from './refrigerant-component.entity';

@Entity({ name: 'master_refrigerants' })
@Unique(['blendCode'])
export class MasterRefrigerant extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  blendCode: string; // R410A, R404A, R134a, R32, R407C

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'BLEND_ZEOTROPIC' })
  refrigerantType: string; // PURE, BLEND_AZEOTROPIC, BLEND_ZEOTROPIC

  @Column({ type: 'varchar', length: 10, nullable: true })
  ashraeSafetyGroup: string; // A1, A2L, B1, etc.

  @Column({ type: 'decimal', precision: 6, scale: 4, default: 0 })
  ozoneDepletionPotential: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('RefrigerantComponent', 'refrigerant')
  components: RefrigerantComponent[];

  validateCompositionSum(): void {
    if (this.components && this.components.length > 0) {
      const sum = this.components.reduce(
        (acc, c) => acc + Number(c.massPercentage || 0),
        0,
      );
      if (Math.abs(sum - 100) > 0.001 && Math.abs(sum - 1.0) > 0.00001) {
        throw new Error(
          `Refrigerant ${this.blendCode} composition total must equal 100% or 1.0 (got ${sum})`,
        );
      }
    }
  }
}
