export interface FactorLookupKey {
  organizationId?: number;
  scopeId: number;
  activityCategoryId: number;
  fuelGasTypeId: number;
  measurementUnitId: number;
  countryId?: number;
  regionId?: number;
  supplierId?: number;
  factorSourceId: number;
  factorVersionId: number;
  effectiveDate: string;
}

export interface ResolvedFactor {
  factorId: number;
  factor: number;
  co2?: number;
  ch4?: number;
  n2o?: number;
  co2e?: number;
  formula?: string;
  source?: string;
  version?: string;
}

export interface IFactorProvider {
  resolveFactor(key: FactorLookupKey): Promise<ResolvedFactor | null>;
  resolveFactorsBatch(keys: FactorLookupKey[]): Promise<Map<string, ResolvedFactor>>;
}

export interface IUnitConverter {
  convert(amount: number, fromUnit: string, toUnit: string): Promise<{ convertedAmount: number; rate: number }>;
}

export interface IGwpProvider {
  getGwpMultipliers(gwpVersionCode: string): Promise<Record<string, number>>;
}
