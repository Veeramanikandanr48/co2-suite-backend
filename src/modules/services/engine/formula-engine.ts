import {
  FormulaContext,
  FormulaStrategy,
  FormulaStrategyResult,
} from './strategies/formula-strategy.interface';
import { ActivityMultiplierStrategy } from './strategies/activity-multiplier.strategy';
import { DistanceWeightStrategy } from './strategies/distance-weight.strategy';
import { SpendEeioStrategy } from './strategies/spend-eeio.strategy';
import { ActivityCode } from 'src/enums/activity-code.enum';

export class FormulaEngine {
  private static readonly strategies: Map<string, FormulaStrategy> = new Map([
    ['ACTIVITY_MULTIPLIER', new ActivityMultiplierStrategy()],
    ['DISTANCE_WEIGHT', new DistanceWeightStrategy()],
    ['SPEND_EEIO', new SpendEeioStrategy()],
  ]);

  /**
   * Resolves appropriate strategy based on activity code or calculation option.
   */
  static resolveStrategy(
    activityCode: string,
    basedOption: string = 'activity',
  ): FormulaStrategy {
    if (basedOption === 'spend') {
      return this.strategies.get('SPEND_EEIO')!;
    }

    const codeUpper = activityCode.toUpperCase();
    switch (codeUpper) {
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return this.strategies.get('DISTANCE_WEIGHT')!;
      default:
        return this.strategies.get('ACTIVITY_MULTIPLIER')!;
    }
  }

  static execute(
    activityCode: string,
    ctx: FormulaContext,
    basedOption: string = 'activity',
  ): FormulaStrategyResult {
    const strategy = this.resolveStrategy(activityCode, basedOption);
    return strategy.calculate(ctx);
  }
}
