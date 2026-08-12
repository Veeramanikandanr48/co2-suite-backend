/**
 * GHG Protocol Scope 2 Guidance (2015) Governance & Versioning Constants
 */
export const SCOPE2_METHODOLOGY = {
  standard: 'GHG_PROTOCOL',
  guidance: 'SCOPE_2_2015',
  implementation: '1.0',
  status: 'ACTIVE',
} as const;

/**
 * GHG Protocol Scope 2 Guidance Chapter 6: 8 Quality Criteria for Contractual Instruments
 */
export interface Scope2QualityCriteriaValidation {
  conveysEmissionRate: boolean; // Criterion 1: Conveys GHG emission rate attributes
  uniqueClaims: boolean; // Criterion 2: Unique claim & non-double counted
  retiredOrCancelled: boolean; // Criterion 3: Tracked & retired/cancelled on registry
  temporalMatching: boolean; // Criterion 4: Generation period aligns with consumption period
  geographicBoundary: boolean; // Criterion 5: Sourced within same market/grid boundary
  supplierSourceValid: boolean; // Criterion 6: Sourced from valid grid/supplier tariff
  factorAccuracy: boolean; // Criterion 7: Calculation methodology accuracy verified
  evidenceAuditability: boolean; // Criterion 8: Evidence chain / certificate reference provided
}

export type Scope2InstrumentType =
  | 'PPA'
  | 'REC'
  | 'GREEN_TARIFF'
  | 'SUPPLIER_SPECIFIC'
  | 'RESIDUAL_MIX'
  | 'GRID_AVERAGE_FALLBACK';

export interface Scope2MarketAllocation {
  instrumentType: Scope2InstrumentType;
  instrumentRef?: string;
  supplierName?: string;
  allocatedQuantity: number; // Consumption amount allocated to this instrument
  allocatedUnit: string; // Physical unit (kWh, MWh, GJ, therms, MMBtu)
  factor: number; // kg CO2e per unit
  emissionTonnes: number; // Allocated tCO2e result
  qualityCriteria: Scope2QualityCriteriaValidation;
  qualityCriteriaMet: boolean;
  evidenceRef?: string;
}

export interface Scope2LocationResult {
  kgCO2e: number;
  tonnesCO2e: number;
  factor: number;
  efSource: string;
  formula: string;
  datasetVersion?: string;
}

export interface Scope2MarketResult {
  kgCO2e: number;
  tonnesCO2e: number;
  factorAllocations: Scope2MarketAllocation[];
  qualityCriteriaPassed: boolean;
  residualMixUsed: boolean;
  unallocatedQuantity: number;
  formula: string;
}

export interface Scope2Result {
  methodologyVersion: string;
  energyType: 'ELECTRICITY' | 'STEAM' | 'HEATING' | 'COOLING';
  locationBased: Scope2LocationResult;
  marketBased: Scope2MarketResult;
}
