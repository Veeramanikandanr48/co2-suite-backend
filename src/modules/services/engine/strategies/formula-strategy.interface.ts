import { GasBreakdownDto } from 'src/dto/calculation-result.dto';

export interface FormulaContext {
  activityCode?: string;
  amount: number;
  unitEf: number;
  unit?: string;
  distance?: number;
  weight?: number;
  spend?: number;
  customFormula?: string;
}

export interface FormulaStrategyResult {
  totalEmission: number;
  calculationTrace: string[];
  unitFactor: GasBreakdownDto;
  emissions: GasBreakdownDto;
}

export interface FormulaStrategy {
  calculate(ctx: FormulaContext): FormulaStrategyResult;
}
