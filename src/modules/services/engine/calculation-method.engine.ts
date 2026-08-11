import { Injectable } from '@nestjs/common';

export type CalculationMethodKey =
  | 'FUEL_BASED'
  | 'DISTANCE_BASED'
  | 'SPEND_BASED'
  | 'LOCATION_BASED'
  | 'MARKET_BASED'
  | 'MASS_BASED'
  | 'SUPPLIER_SPECIFIC';

export interface CalculationInput {
  amount: number;
  ef: number;
  unit?: string;
  formula?: string;
  method?: string;
  distance?: number;
  weight?: number;
  spend?: number;
  leakageRate?: number;
  gwp?: number;
  equityShare?: number;
}

export interface CalculationResult {
  emission: number; // In Metric Tonnes CO2e (tCO2e)
  methodUsed: CalculationMethodKey;
  formulaApplied: string;
}

@Injectable()
export class CalculationMethodEngine {
  /**
   * Routes activity inputs dynamically based on the category calculation method
   */
  calculateEmission(input: CalculationInput): CalculationResult {
    const amountVal = Number(input.amount) || 0;
    const factorVal = Number(input.ef) || 0;
    const rawMethod = (input.method || 'FUEL_BASED').toUpperCase().trim();

    let methodKey: CalculationMethodKey = 'FUEL_BASED';

    if (rawMethod.includes('DISTANCE')) methodKey = 'DISTANCE_BASED';
    else if (rawMethod.includes('SPEND')) methodKey = 'SPEND_BASED';
    else if (rawMethod.includes('LOCATION')) methodKey = 'LOCATION_BASED';
    else if (rawMethod.includes('MARKET')) methodKey = 'MARKET_BASED';
    else if (rawMethod.includes('MASS')) methodKey = 'MASS_BASED';
    else if (rawMethod.includes('SUPPLIER')) methodKey = 'SUPPLIER_SPECIFIC';

    switch (methodKey) {
      case 'DISTANCE_BASED': {
        const dist = Number(input.distance || amountVal);
        const weight = Number(input.weight || 1.0);
        const tonneKm = dist * weight;
        const emission = Number(((tonneKm * factorVal) / 1000).toFixed(6));
        return {
          emission,
          methodUsed: 'DISTANCE_BASED',
          formulaApplied: `(Distance [${dist}] × Weight [${weight}] × EF [${factorVal}]) / 1000 = ${emission} tCO2e`,
        };
      }

      case 'SPEND_BASED': {
        const spendVal = Number(input.spend || amountVal);
        const emission = Number(((spendVal * factorVal) / 1000).toFixed(6));
        return {
          emission,
          methodUsed: 'SPEND_BASED',
          formulaApplied: `(Spend [${spendVal}] × EEIO_Factor [${factorVal}]) / 1000 = ${emission} tCO2e`,
        };
      }

      case 'LOCATION_BASED': {
        const emission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        return {
          emission,
          methodUsed: 'LOCATION_BASED',
          formulaApplied: `(Electricity [${amountVal} kWh] × Location_Grid_EF [${factorVal}]) / 1000 = ${emission} tCO2e`,
        };
      }

      case 'MARKET_BASED': {
        const emission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        return {
          emission,
          methodUsed: 'MARKET_BASED',
          formulaApplied: `(Electricity [${amountVal} kWh] × Market_Supplier_EF [${factorVal}]) / 1000 = ${emission} tCO2e`,
        };
      }

      case 'MASS_BASED': {
        const emission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        return {
          emission,
          methodUsed: 'MASS_BASED',
          formulaApplied: `(Mass [${amountVal} kg] × EF [${factorVal}]) / 1000 = ${emission} tCO2e`,
        };
      }

      case 'SUPPLIER_SPECIFIC': {
        const share = Number(input.equityShare || 1.0);
        const emission = Number((amountVal * factorVal * share).toFixed(6));
        return {
          emission,
          methodUsed: 'SUPPLIER_SPECIFIC',
          formulaApplied: `Supplier Activity [${amountVal}] × Supplier_EF [${factorVal}] × Share [${share}] = ${emission} tCO2e`,
        };
      }

      case 'FUEL_BASED':
      default: {
        const emission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        return {
          emission,
          methodUsed: 'FUEL_BASED',
          formulaApplied: `(Amount [${amountVal}] × EF [${factorVal}]) / 1000 = ${emission} tCO2e`,
        };
      }
    }
  }
}
