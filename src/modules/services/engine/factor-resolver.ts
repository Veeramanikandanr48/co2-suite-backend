import { ActivityCode } from 'src/enums/activity-code.enum';

export interface GasSpeciesRatio {
  CO2: number;
  CH4: number;
  N2O: number;
  HFC: number;
  PFC: number;
  SF6: number;
  NF3: number;
}

export class FactorResolver {
  static resolveSupportedSources(activityCode: string): string[] {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.SC:
        return [
          'IPCC (Commercial & Institutional Use)',
          'IPCC (Manufacturing)',
          'DEFRA 2024',
          'EPA 2024',
        ];
      case ActivityCode.MC:
        return ['IPCC', 'DEFRA 2024', 'EPA 2024'];
      case ActivityCode.FE:
        return ['IPCC-AR6 GWP', 'DEFRA 2024'];
      case ActivityCode.PE:
        return [
          'IEA Grid Factors 2023',
          'DEFRA UK Grid 2024',
          'IEA Europe 2023',
        ];
      case ActivityCode.PHC:
        return ['DEFRA 2024', 'IPCC District Energy'];
      case ActivityCode.PGS:
      case ActivityCode.CG:
        return ['Ecoinvent 3.9', 'EXIOBASE 3', 'DEFRA 2024'];
      default:
        return ['IPCC', 'DEFRA 2024', 'Ecoinvent 3.9'];
    }
  }

  static resolveAcceptedUnits(activityCode: string): string[] {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.SC:
        return ['sm3', 'L', 'kg', 'm3', 'kWh'];
      case ActivityCode.MC:
        return ['L', 'km', 'kg', 'gallon'];
      case ActivityCode.FE:
        return ['kg', 'g', '%'];
      case ActivityCode.PE:
      case ActivityCode.PHC:
        return ['kWh', 'MWh', 'GJ'];
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return ['t-km', 'km', 'kg', 'tonnes'];
      default:
        return ['kg', 'tonnes', 'sm3', 'L', 'kWh', 'USD', 'EUR'];
    }
  }

  static resolveRequiredFields(activityCode: string): string[] {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.FE:
        return [
          'refrigerantGasType',
          'calculationMethod',
          'amountOrLeakageRate',
        ];
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return ['transportMode', 'distance', 'weightOrTonneKm'];
      case ActivityCode.INV:
        return [
          'investeeName',
          'investeeScope1Emissions',
          'investeeScope2Emissions',
          'equitySharePercent',
        ];
      default:
        return ['fuelOrActivityType', 'amount', 'unit'];
    }
  }

  /**
   * Resolves gas species emission ratios matching CageSuite & IPCC standard factors
   */
  static resolveGasRatios(activityCode: string): GasSpeciesRatio {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.MC:
        // Exact CageSuite Mobile Combustion ratio breakdown: CO2: 98.44%, N2O: 1.41%, CH4: 0.15%
        return {
          CO2: 0.9844,
          CH4: 0.0015,
          N2O: 0.0141,
          HFC: 0,
          PFC: 0,
          SF6: 0,
          NF3: 0,
        };
      case ActivityCode.FE:
        // Fugitive refrigerant/fire-extinguisher gases
        return { CO2: 1.0, CH4: 0, N2O: 0, HFC: 0, PFC: 0, SF6: 0, NF3: 0 };
      case ActivityCode.SC:
      default:
        // Standard Stationary Combustion: CO2: 99.70%, CH4: 0.25%, N2O: 0.05%
        return {
          CO2: 0.997,
          CH4: 0.0025,
          N2O: 0.0005,
          HFC: 0,
          PFC: 0,
          SF6: 0,
          NF3: 0,
        };
    }
  }

  static resolveDefaultFormula(
    activityCode: string,
    basedOption: string = 'activity',
  ): string {
    if (basedOption === 'spend') {
      return '(spend * eeio_factor) / 1000';
    }

    switch (activityCode.toUpperCase()) {
      case ActivityCode.FE:
        return '(amount * (leakage / 100) * GWP) / 1000';
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return '(distance * weight * factor) / 1000';
      case ActivityCode.INV:
        return 'investee_emissions * (equity_share / 100)';
      default:
        return '(amount * factor) / 1000';
    }
  }
}
