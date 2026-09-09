import {
  FormulaContext,
  FormulaStrategy,
  FormulaStrategyResult,
} from './strategies/formula-strategy.interface';
import { ActivityMultiplierStrategy } from './strategies/activity-multiplier.strategy';
import { DistanceWeightStrategy } from './strategies/distance-weight.strategy';
import { SpendEeioStrategy } from './strategies/spend-eeio.strategy';
import { EmployeeCommutingStrategy } from './strategies/employee-commuting.strategy';
import { GasCalculator } from './gas-calculator';
import { ActivityCode } from 'src/enums/activity-code.enum';
import { GasBreakdownDto } from 'src/dto/calculation-result.dto';

export class FormulaEngine {
  private static readonly strategies: Map<string, FormulaStrategy> = new Map([
    ['ACTIVITY_MULTIPLIER', new ActivityMultiplierStrategy()],
    ['DISTANCE_WEIGHT', new DistanceWeightStrategy()],
    ['SPEND_EEIO', new SpendEeioStrategy()],
    ['EMPLOYEE_COMMUTING', new EmployeeCommutingStrategy()],
  ]);

  /**
   * Evaluates a mathematical formula expression with dynamic variable bindings.
   * Uses safe recursive-descent tokenized arithmetic parsing without eval() or Function().
   * Supports: +, -, *, /, ^, (, ), and identifier lookups (case-insensitive).
   * e.g. "(amount * factor) / 1000", "(distance * weight * factor) / 1000", "spend * eeio_factor"
   */
  static evaluate(
    expression: string,
    variables: Record<string, number>,
  ): number {
    if (!expression || !expression.trim()) {
      return 0;
    }

    // Normalize variable keys to lowercase
    const normalizedVars: Record<string, number> = {};
    for (const [k, v] of Object.entries(variables)) {
      normalizedVars[k.toLowerCase()] = Number(v) || 0;
    }

    // Aliases
    if (normalizedVars.factor !== undefined && normalizedVars.ef === undefined) {
      normalizedVars.ef = normalizedVars.factor;
    }
    if (normalizedVars.ef !== undefined && normalizedVars.factor === undefined) {
      normalizedVars.factor = normalizedVars.ef;
    }

    // Tokenizer
    type TokenType = 'NUMBER' | 'IDENTIFIER' | 'OPERATOR' | 'LPAREN' | 'RPAREN';
    interface Token {
      type: TokenType;
      value: string;
    }

    const tokens: Token[] = [];
    const src = expression.trim();
    let i = 0;

    while (i < src.length) {
      const ch = src[i];

      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      if (/[0-9.]/.test(ch)) {
        let numStr = '';
        while (i < src.length && /[0-9.]/.test(src[i])) {
          numStr += src[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) {
          ident += src[i];
          i++;
        }
        tokens.push({ type: 'IDENTIFIER', value: ident });
        continue;
      }

      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      if (['+', '-', '*', '/', '^', '%'].includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch });
        i++;
        continue;
      }

      // Ignore unknown characters
      i++;
    }

    let pos = 0;

    function peek(): Token | undefined {
      return tokens[pos];
    }

    function consume(expected?: string): Token {
      const t = tokens[pos];
      if (!t) {
        throw new Error('Unexpected end of expression');
      }
      if (expected && t.value !== expected) {
        throw new Error(`Expected ${expected} but got ${t.value}`);
      }
      pos++;
      return t;
    }

    function parseExpression(): number {
      let val = parseTerm();
      while (peek() && (peek()!.value === '+' || peek()!.value === '-')) {
        const op = consume().value;
        const right = parseTerm();
        val = op === '+' ? val + right : val - right;
      }
      return val;
    }

    function parseTerm(): number {
      let val = parseFactor();
      while (
        peek() &&
        (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')
      ) {
        const op = consume().value;
        const right = parseFactor();
        if (op === '*') {
          val = val * right;
        } else if (op === '/') {
          val = right === 0 ? 0 : val / right;
        } else if (op === '%') {
          val = right === 0 ? 0 : val % right;
        }
      }
      return val;
    }

    function parseFactor(): number {
      // Unary operators
      if (peek() && peek()!.value === '-') {
        consume('-');
        return -parseFactor();
      }
      if (peek() && peek()!.value === '+') {
        consume('+');
        return parseFactor();
      }

      let val = parsePrimary();
      if (peek() && peek()!.value === '^') {
        consume('^');
        const right = parseFactor();
        val = Math.pow(val, right);
      }
      return val;
    }

    function parsePrimary(): number {
      const t = peek();
      if (!t) {
        return 0;
      }

      if (t.type === 'NUMBER') {
        consume();
        return parseFloat(t.value) || 0;
      }

      if (t.type === 'IDENTIFIER') {
        consume();
        const key = t.value.toLowerCase();
        return normalizedVars[key] ?? 0;
      }

      if (t.type === 'LPAREN') {
        consume('(');
        const val = parseExpression();
        if (peek() && peek()!.value === ')') {
          consume(')');
        }
        return val;
      }

      consume();
      return 0;
    }

    try {
      const res = parseExpression();
      return isFinite(res) && !isNaN(res) ? res : 0;
    } catch {
      return 0;
    }
  }

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
      case ActivityCode.EC:
        return this.strategies.get('EMPLOYEE_COMMUTING')!;
      default:
        return this.strategies.get('ACTIVITY_MULTIPLIER')!;
    }
  }

  static execute(
    activityCode: string,
    ctx: FormulaContext,
    basedOption: string = 'activity',
    formulaExpression?: string,
    customGasRatios?: Partial<GasBreakdownDto> | null,
  ): FormulaStrategyResult {
    const expr = (formulaExpression || ctx.customFormula || '').trim();

    if (expr) {
      const vars: Record<string, number> = {
        amount: Number(ctx.amount || 0),
        factor: Number(ctx.unitEf || 1.0),
        ef: Number(ctx.unitEf || 1.0),
        distance: Number(ctx.distance || 0),
        weight: Number(ctx.weight || 0),
        spend: Number(ctx.spend || 0),
        days: Number(ctx.days || 0),
        ...(ctx.variables || {}),
      };

      const rawResult = this.evaluate(expr, vars);
      const totalEmission = Number(rawResult.toFixed(6));

      const trace = [
        `Expression: ${expr}`,
        `Variables: ${JSON.stringify(vars)}`,
        `Calculated: ${totalEmission} tCO2e`,
      ];

      const { emissions, unitFactor } = GasCalculator.calculateBreakdown(
        totalEmission,
        ctx.unitEf,
        activityCode,
        customGasRatios || ctx.customGasRatios,
      );

      return {
        totalEmission,
        calculationTrace: trace,
        unitFactor,
        emissions,
      };
    }

    const strategy = this.resolveStrategy(activityCode, basedOption);
    return strategy.calculate(ctx);
  }
}
