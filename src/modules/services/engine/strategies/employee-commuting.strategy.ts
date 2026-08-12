import {
  FormulaContext,
  FormulaStrategy,
  FormulaStrategyResult,
} from './formula-strategy.interface';
import { GasCalculator } from '../gas-calculator';

export class EmployeeCommutingStrategy implements FormulaStrategy {
  calculate(ctx: FormulaContext): FormulaStrategyResult {
    const dailyDist = Number(ctx.distance || ctx.amount || 0);
    const days = Number(ctx.days || 1);
    const ef = Number(ctx.unitEf || 1.0);
    
    // Formula: (AD x TD x EF) / 1000 = tCO2eq
    const totalKm = dailyDist * days;
    const totalEmission = Number(((totalKm * ef) / 1000).toFixed(6));

    const trace = [
      `Daily Travel Distance (AD): ${dailyDist} km`,
      `Days Travelled (TD): ${days} days`,
      `Total Distance: ${totalKm} km`,
      `Emission Factor (EF): ${ef} kgCO2e/km`,
      `Formula Applied: (AD × TD × EF) / 1000`,
      `Calculation: (${dailyDist} × ${days} × ${ef}) / 1000 = ${totalEmission} tCO2e`,
    ];

    const { emissions, unitFactor } = GasCalculator.calculateBreakdown(
      totalEmission,
      ef,
      ctx.activityCode || 'EC',
    );

    return {
      totalEmission,
      calculationTrace: trace,
      unitFactor,
      emissions,
    };
  }
}
