import {
  FormulaContext,
  FormulaStrategy,
  FormulaStrategyResult,
} from './formula-strategy.interface';
import { GasCalculator } from '../gas-calculator';

export class ActivityMultiplierStrategy implements FormulaStrategy {
  calculate(ctx: FormulaContext): FormulaStrategyResult {
    const amount = Number(ctx.amount || 0);
    const ef = Number(ctx.unitEf || 1.0);
    const totalEmission = Number(((amount * ef) / 1000).toFixed(6));

    const trace = [
      `Input Amount: ${amount} ${ctx.unit || 'units'}`,
      `Unit Emission Factor: ${ef} kgCO2e/${ctx.unit || 'unit'}`,
      `Formula Applied: (Amount × Factor) / 1000`,
      `Calculation: (${amount} × ${ef}) / 1000 = ${totalEmission} tCO2e`,
    ];

    const { emissions, unitFactor } = GasCalculator.calculateBreakdown(
      totalEmission,
      ef,
      ctx.activityCode || 'SC',
    );

    return {
      totalEmission,
      calculationTrace: trace,
      unitFactor,
      emissions,
    };
  }
}
