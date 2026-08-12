export enum GwpAssessment {
  AR4 = 'AR4',
  AR5 = 'AR5',
  AR6 = 'AR6',
}

export enum MethaneOrigin {
  FOSSIL = 'FOSSIL',
  NON_FOSSIL = 'NON_FOSSIL',
}

export enum MethodologyStatus {
  CURRENT = 'CURRENT',
  DRAFT = 'DRAFT',
  RETIRED = 'RETIRED',
  CUSTOM_APPROVED = 'CUSTOM_APPROVED',
}

export enum FactorDataQuality {
  PRIMARY = 'PRIMARY',
  SUPPLIER_SPECIFIC = 'SUPPLIER_SPECIFIC',
  AVERAGE_DATA = 'AVERAGE_DATA',
  ESTIMATED = 'ESTIMATED',
}

export enum InclusionStatus {
  INCLUDED = 'INCLUDED',
  EXCLUDED = 'EXCLUDED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export enum ConsolidationApproach {
  EQUITY_SHARE = 'EQUITY_SHARE',
  OPERATIONAL_CONTROL = 'OPERATIONAL_CONTROL',
  FINANCIAL_CONTROL = 'FINANCIAL_CONTROL',
}

export enum Scope2ReportingBasis {
  LOCATION_BASED = 'LOCATION_BASED',
  MARKET_BASED = 'MARKET_BASED',
  DUAL = 'DUAL',
}

export enum CalculationRunType {
  SAVE = 'SAVE',
  UPDATE = 'UPDATE',
  RECALCULATE = 'RECALCULATE',
  RETRO = 'RETRO',
}

export enum CalculationResultStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  RECALCULATE = 'RECALCULATE',
  FALLBACK = 'FALLBACK',
  BOUNDARY_CHANGE = 'BOUNDARY_CHANGE',
}

export const GAS_CODES = [
  'CO2',
  'CH4',
  'N2O',
  'HFC',
  'PFC',
  'SF6',
  'NF3',
] as const;

export type GasCode = (typeof GAS_CODES)[number];