import { GasBreakdownDto } from 'src/dto/calculation-result.dto';
import { FactorResolver } from './factor-resolver';

export class GasCalculator {
  /**
   * Dynamically calculates exact CageSuite emissions object structure
   */
  static calculateBreakdown(
    totalEmission: number,
    unitEf: number,
    activityCode: string = 'SC',
  ): { emissions: GasBreakdownDto; unitFactor: GasBreakdownDto } {
    const total = Number(totalEmission || 0);
    const ef = Number(unitEf || 1.0);

    const ratios = FactorResolver.resolveGasRatios(activityCode);

    const emissions: GasBreakdownDto = {
      SF6: Number((total * ratios.SF6).toFixed(6)),
      total,
      HFC: Number((total * ratios.HFC).toFixed(6)),
      CO2: Number((total * ratios.CO2).toFixed(6)),
      N2O: Number((total * ratios.N2O).toFixed(6)),
      NF3: Number((total * ratios.NF3).toFixed(6)),
      PFC: Number((total * ratios.PFC).toFixed(6)),
      CH4: Number((total * ratios.CH4).toFixed(6)),
    };

    const unitFactor: GasBreakdownDto = {
      SF6: Number((ef * ratios.SF6).toFixed(6)),
      total: ef,
      HFC: Number((ef * ratios.HFC).toFixed(6)),
      CO2: Number((ef * ratios.CO2).toFixed(6)),
      N2O: Number((ef * ratios.N2O).toFixed(6)),
      NF3: Number((ef * ratios.NF3).toFixed(6)),
      PFC: Number((ef * ratios.PFC).toFixed(6)),
      CH4: Number((ef * ratios.CH4).toFixed(6)),
    };

    return { emissions, unitFactor };
  }
}
