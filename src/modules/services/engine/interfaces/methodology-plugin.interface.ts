import { CalculationContext } from './calculation-context.interface';
import { FormulaStrategyResult } from '../strategies/formula-strategy.interface';

export interface MethodologyManifest {
  id: string;
  name: string;
  version: string;
  standard: string;
  supportedScopes: string[];
  requiredFields: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface IMethodologyPlugin {
  readonly manifest: MethodologyManifest;

  validateInput(input: Record<string, any>): ValidationResult;
  execute(ctx: CalculationContext): Promise<FormulaStrategyResult>;
}
