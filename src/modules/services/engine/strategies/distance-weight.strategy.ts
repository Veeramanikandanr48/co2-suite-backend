import {
  FormulaContext,
  FormulaStrategy,
  FormulaStrategyResult,
} from './formula-strategy.interface';
import { GasCalculator } from '../gas-calculator';

export class DistanceWeightStrategy implements FormulaStrategy {
  calculate(ctx: FormulaContext): FormulaStrategyResult {
    const dist = Number(ctx.distance || ctx.amount || 0);
    const weight = Number(ctx.weight || 1.0);
    const ef = Number(ctx.unitEf || 1.0);
    const totalTonneKm = dist * weight;
    const totalEmission = Number(((totalTonneKm * ef) / 1000).toFixed(6));

    const trace = [
      `Distance: ${dist} km, Cargo Weight: ${weight} tonnes`,
      `Computed Freight Volume: ${totalTonneKm} t-km`,
      `Emission Factor: ${ef} kgCO2e/t-km`,
      `Formula Applied: (Distance × Weight × Factor) / 1000`,
      `Calculation: (${dist} × ${weight} × ${ef}) / 1000 = ${totalEmission} tCO2e`,
    ];

    const { emissions, unitFactor } = GasCalculator.calculateBreakdown(
      totalEmission,
      ef,
      ctx.activityCode || 'UTD',
    );

    return {
      totalEmission,
      calculationTrace: trace,
      unitFactor,
      emissions,
    };
  }
}
