import { IFactorProvider, IGwpProvider, IUnitConverter } from './factor-provider.interface';

export interface CalculationContext {
  organizationId?: number;
  activityCode?: string;
  category: string;
  fuelOrGasType: string;
  amount: number;
  unit: string;
  effectiveDate: string;
  countryId?: number;
  regionId?: number;
  customInputs?: Record<string, any>;

  // Injected Platform Infrastructure Services (Dependency Inversion)
  factorProvider: IFactorProvider;
  unitConverter: IUnitConverter;
  gwpProvider: IGwpProvider;
}
