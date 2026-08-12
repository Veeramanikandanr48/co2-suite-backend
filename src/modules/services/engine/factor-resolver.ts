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
      case ActivityCode.MC:
      case ActivityCode.FE:
      case ActivityCode.DPE:
        return ['DEFRA 2024', 'IPCC', 'Custom'];
      case ActivityCode.PE:
      case ActivityCode.PHC:
        return [
          'DEWA (Dubai)',
          'India (CEA)',
          'Local Authority',
          'DEFRA 2024',
          'IEA Grid Factors 2023',
        ];
      case ActivityCode.PGS:
        return ['DEFRA 2024', 'IAEG', 'Custom'];
      case ActivityCode.CG:
        return ['IAEG', 'Custom', 'DEFRA 2024'];
      case ActivityCode.FERA:
        return ['DEFRA 2024', 'DEWA (Dubai)', 'India Grid', 'Local Provider'];
      case ActivityCode.UTD:
      case ActivityCode.DTD:
      case ActivityCode.WGB:
      case ActivityCode.BT:
      case ActivityCode.EC:
        return ['DEFRA 2024', 'Custom'];
      default:
        return ['DEFRA 2024', 'IPCC', 'IAEG', 'Custom'];
    }
  }

  static resolveAcceptedUnits(activityCode: string): string[] {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.SC:
        return ['L', 'sm3', 'kg', 'm3', 'kWh'];
      case ActivityCode.MC:
        return ['L', 'km'];
      case ActivityCode.FE:
      case ActivityCode.DPE:
        return ['kg'];
      case ActivityCode.PE:
      case ActivityCode.PHC:
        return ['kWh', 'MWh'];
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return ['km', 'tonne.km'];
      case ActivityCode.WGB:
        return ['ton', 'kg'];
      case ActivityCode.BT:
        return ['pas.km', 'km'];
      case ActivityCode.EC:
        return ['km', 'pas.km'];
      default:
        return ['kg', 'ton', 'L', 'kWh', 'USD'];
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
