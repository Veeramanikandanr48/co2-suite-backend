import {
  FormulaContext,
  FormulaStrategy,
  FormulaStrategyResult,
} from './formula-strategy.interface';
import { GasCalculator } from '../gas-calculator';

export class SpendEeioStrategy implements FormulaStrategy {
  calculate(ctx: FormulaContext): FormulaStrategyResult {
    const spend = Number(ctx.spend || ctx.amount || 0);
    const eeioFactor = Number(ctx.unitEf || 0.45);
    const totalEmission = Number(((spend * eeioFactor) / 1000).toFixed(6));

    const trace = [
      `Monetary Spend: ${spend} ${ctx.unit || 'USD'}`,
      `EEIO Multiplier Factor: ${eeioFactor} kgCO2e/$ spend`,
      `Formula Applied: (Spend × EEIO Factor) / 1000`,
      `Calculation: (${spend} × ${eeioFactor}) / 1000 = ${totalEmission} tCO2e`,
    ];

    const { emissions, unitFactor } = GasCalculator.calculateBreakdown(
      totalEmission,
      eeioFactor,
      ctx.activityCode || 'PGS',
    );

    return {
      totalEmission,
      calculationTrace: trace,
      unitFactor,
      emissions,
    };
  }
}
